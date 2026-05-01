import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoolDto } from './dto/create-pool.dto';
import { UpdatePoolDto } from './dto/update-pool.dto';

const DEFAULT_RULES = [
  { name: 'EXACT_SCORE', description: 'Acertar placar exato', points: 5 },
  { name: 'CORRECT_WINNER', description: 'Acertar vencedor', points: 3 },
  { name: 'CORRECT_DRAW', description: 'Acertar empate', points: 3 },
  { name: 'WRONG', description: 'Errar tudo', points: 0 },
];

const DEFAULT_TIEBREAKERS = [
  { criteria: 'MOST_EXACT_SCORES', priority: 1 },
  { criteria: 'MOST_CORRECT_WINNERS', priority: 2 },
  { criteria: 'EARLIEST_JOIN', priority: 3 },
];

@Injectable()
export class PoolsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePoolDto) {
    const pool = await this.prisma.pool.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type || 'PUBLIC',
        leagueId: dto.leagueId,
        creatorId: userId,
        pixKey: dto.pixKey,
        pixName: dto.pixName,
        entryFee: dto.entryFee,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        rules: {
          create: DEFAULT_RULES,
        },
        tiebreakers: {
          create: DEFAULT_TIEBREAKERS,
        },
        participants: {
          create: {
            userId,
            role: 'ADMIN',
            status: 'APPROVED',
          },
        },
      },
      include: {
        league: true,
        rules: true,
        tiebreakers: { orderBy: { priority: 'asc' } },
        _count: { select: { participants: { where: { status: 'APPROVED' } } } },
      },
    });

    return pool;
  }

  async findAll(filters?: { type?: string; leagueId?: string; search?: string }) {
    const where: any = { type: 'PUBLIC' };

    if (filters?.leagueId) {
      where.leagueId = filters.leagueId;
    }
    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.pool.findMany({
      where,
      include: {
        league: true,
        creator: { select: { id: true, name: true } },
        _count: { select: { participants: { where: { status: 'APPROVED' } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const pool = await this.prisma.pool.findUnique({
      where: { id },
      include: {
        league: true,
        creator: { select: { id: true, name: true } },
        rules: true,
        tiebreakers: { orderBy: { priority: 'asc' } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { participants: { where: { status: 'APPROVED' } } } },
      },
    });

    if (!pool) throw new NotFoundException('Bolão não encontrado');
    return pool;
  }

  async findByInviteCode(code: string) {
    const pool = await this.prisma.pool.findUnique({
      where: { inviteCode: code },
      include: {
        league: true,
        creator: { select: { id: true, name: true } },
        _count: { select: { participants: { where: { status: 'APPROVED' } } } },
      },
    });

    if (!pool) throw new NotFoundException('Bolão não encontrado');
    return pool;
  }

  async update(id: string, userId: string, dto: UpdatePoolDto) {
    await this.ensurePoolAdmin(id, userId);

    return this.prisma.pool.update({
      where: { id },
      data: dto,
      include: {
        league: true,
        rules: true,
        tiebreakers: { orderBy: { priority: 'asc' } },
      },
    });
  }

  async delete(id: string, userId: string, isSuperAdmin = false) {
    if (!isSuperAdmin) {
      const pool = await this.prisma.pool.findUnique({ where: { id } });
      if (!pool) throw new NotFoundException('Bolão não encontrado');
      if (pool.creatorId !== userId) {
        throw new ForbiddenException('Apenas o criador pode excluir o bolão');
      }
    }

    return this.prisma.pool.delete({ where: { id } });
  }

  async getUserPools(userId: string) {
    return this.prisma.pool.findMany({
      where: {
        participants: {
          some: { userId, status: 'APPROVED' },
        },
      },
      include: {
        league: true,
        creator: { select: { id: true, name: true } },
        _count: { select: { participants: { where: { status: 'APPROVED' } } } },
        participants: {
          where: { userId },
          select: { role: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Participação
  async requestJoin(poolId: string, userId: string) {
    const existing = await this.prisma.poolParticipant.findUnique({
      where: { userId_poolId: { userId, poolId } },
    });

    if (existing) {
      if (existing.status === 'REJECTED') {
        return this.prisma.poolParticipant.update({
          where: { id: existing.id },
          data: { status: 'PENDING' },
        });
      }
      throw new ConflictException('Você já solicitou entrada neste bolão');
    }

    return this.prisma.poolParticipant.create({
      data: { userId, poolId, status: 'PENDING' },
    });
  }

  async approveParticipant(poolId: string, participantId: string, adminUserId: string) {
    await this.ensurePoolAdmin(poolId, adminUserId);

    return this.prisma.poolParticipant.update({
      where: { id: participantId },
      data: { status: 'APPROVED' },
    });
  }

  async rejectParticipant(poolId: string, participantId: string, adminUserId: string) {
    await this.ensurePoolAdmin(poolId, adminUserId);

    return this.prisma.poolParticipant.update({
      where: { id: participantId },
      data: { status: 'REJECTED' },
    });
  }

  async leavePool(poolId: string, userId: string) {
    const participant = await this.prisma.poolParticipant.findUnique({
      where: { userId_poolId: { userId, poolId } },
    });

    if (!participant) throw new NotFoundException('Participação não encontrada');

    const pool = await this.prisma.pool.findUnique({ where: { id: poolId } });
    if (pool?.creatorId === userId) {
      throw new ForbiddenException('O criador não pode sair do bolão');
    }

    return this.prisma.poolParticipant.delete({
      where: { id: participant.id },
    });
  }

  async getPendingParticipants(poolId: string, adminUserId: string) {
    await this.ensurePoolAdmin(poolId, adminUserId);

    return this.prisma.poolParticipant.findMany({
      where: { poolId, status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  // Regras
  async updateRules(poolId: string, userId: string, rules: { id?: string; name: string; description?: string; points: number }[]) {
    await this.ensurePoolAdmin(poolId, userId);

    await this.prisma.poolRule.deleteMany({ where: { poolId } });

    return this.prisma.poolRule.createMany({
      data: rules.map((r) => ({ ...r, poolId, id: undefined })),
    });
  }

  async updateTiebreakers(poolId: string, userId: string, tiebreakers: { criteria: string; priority: number }[]) {
    await this.ensurePoolAdmin(poolId, userId);

    await this.prisma.tiebreaker.deleteMany({ where: { poolId } });

    return this.prisma.tiebreaker.createMany({
      data: tiebreakers.map((t) => ({ ...t, poolId })),
    });
  }

  private async ensurePoolAdmin(poolId: string, userId: string) {
    const participant = await this.prisma.poolParticipant.findUnique({
      where: { userId_poolId: { userId, poolId } },
    });

    if (!participant || participant.role !== 'ADMIN' || participant.status !== 'APPROVED') {
      // Check if super admin
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Apenas admins do bolão podem realizar esta ação');
      }
    }
  }
}
