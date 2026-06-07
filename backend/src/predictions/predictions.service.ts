import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';

@Injectable()
export class PredictionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePredictionDto) {
    // Verificar se o jogo ainda não começou
    const match = await this.prisma.match.findUnique({
      where: { id: dto.matchId },
    });

    if (!match) throw new NotFoundException('Jogo não encontrado');

    if (match.status !== 'SCHEDULED') {
      throw new BadRequestException('Não é possível dar palpite após o início do jogo');
    }

    if (match.matchDate <= new Date()) {
      throw new BadRequestException('Não é possível dar palpite após o horário do jogo');
    }

    // Verificar se o usuário é participante aprovado do bolão
    const participant = await this.prisma.poolParticipant.findUnique({
      where: { userId_poolId: { userId, poolId: dto.poolId } },
    });

    if (!participant || participant.status !== 'APPROVED') {
      throw new ForbiddenException('Você não é participante aprovado deste bolão');
    }

    // Verificar se o jogo pertence ao campeonato do bolão
    const pool = await this.prisma.pool.findUnique({ where: { id: dto.poolId } });
    if (pool && match.leagueId !== pool.leagueId) {
      throw new BadRequestException('Este jogo não pertence ao campeonato do bolão');
    }

    // Upsert do palpite
    return this.prisma.prediction.upsert({
      where: {
        userId_matchId_poolId: {
          userId,
          matchId: dto.matchId,
          poolId: dto.poolId,
        },
      },
      update: {
        homeScore: dto.homeScore,
        awayScore: dto.awayScore,
      },
      create: {
        userId,
        matchId: dto.matchId,
        poolId: dto.poolId,
        homeScore: dto.homeScore,
        awayScore: dto.awayScore,
      },
    });
  }

  async getUserPredictions(userId: string, poolId: string) {
    return this.prisma.prediction.findMany({
      where: { userId, poolId },
      include: {
        match: true,
      },
      orderBy: { match: { matchDate: 'asc' } },
    });
  }

  async getMatchPredictions(matchId: string, poolId: string) {
    // Só mostrar palpites de jogos que já começaram
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (match && match.status === 'SCHEDULED' && match.matchDate > new Date()) {
      return []; // Não revelar palpites antes do jogo
    }

    return this.prisma.prediction.findMany({
      where: { matchId, poolId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async getUserPredictionHistory(userId: string) {
    return this.prisma.prediction.findMany({
      where: { userId, calculated: true },
      include: {
        match: true,
      },
      orderBy: { match: { matchDate: 'desc' } },
      take: 50,
    });
  }

  /**
   * Copia palpites de um bolão para outros bolões do mesmo campeonato.
   * Só copia para jogos que ainda não começaram e onde o usuário não tem palpite.
   */
  async copyToOtherPools(userId: string, sourcePoolId: string) {
    // Buscar o campeonato do bolão de origem
    const sourcePool = await this.prisma.pool.findUnique({
      where: { id: sourcePoolId },
      select: { leagueId: true },
    });
    if (!sourcePool) return { copied: 0, pools: [] };

    // Buscar outros bolões do mesmo campeonato que o usuário participa
    const otherPools = await this.prisma.poolParticipant.findMany({
      where: {
        userId,
        status: 'APPROVED',
        poolId: { not: sourcePoolId },
        pool: { leagueId: sourcePool.leagueId },
      },
      select: { poolId: true, pool: { select: { name: true } } },
    });

    if (otherPools.length === 0) return { copied: 0, pools: [] };

    // Buscar palpites do usuário no bolão de origem (só jogos futuros)
    const now = new Date();
    const sourcePredictions = await this.prisma.prediction.findMany({
      where: {
        userId,
        poolId: sourcePoolId,
        match: { status: 'SCHEDULED', matchDate: { gt: now } },
      },
    });

    let totalCopied = 0;
    const poolNames: string[] = [];

    for (const otherPool of otherPools) {
      let copiedToThis = 0;
      for (const pred of sourcePredictions) {
        // Verificar se já tem palpite nesse bolão para esse jogo
        const existing = await this.prisma.prediction.findUnique({
          where: {
            userId_matchId_poolId: {
              userId,
              matchId: pred.matchId,
              poolId: otherPool.poolId,
            },
          },
        });

        if (!existing) {
          await this.prisma.prediction.create({
            data: {
              userId,
              matchId: pred.matchId,
              poolId: otherPool.poolId,
              homeScore: pred.homeScore,
              awayScore: pred.awayScore,
            },
          });
          copiedToThis++;
        }
      }

      if (copiedToThis > 0) {
        totalCopied += copiedToThis;
        poolNames.push(otherPool.pool.name);
      }
    }

    return { copied: totalCopied, pools: poolNames };
  }

  /** Retorna outros bolões do mesmo campeonato que o usuário participa */
  async getRelatedPools(userId: string, poolId: string) {
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
      select: { leagueId: true },
    });
    if (!pool) return [];

    return this.prisma.poolParticipant.findMany({
      where: {
        userId,
        status: 'APPROVED',
        poolId: { not: poolId },
        pool: { leagueId: pool.leagueId },
      },
      select: { pool: { select: { id: true, name: true } } },
    });
  }
}
