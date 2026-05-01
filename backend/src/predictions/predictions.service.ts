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
}
