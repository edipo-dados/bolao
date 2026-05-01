import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RankingEntry {
  userId: string;
  userName: string;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
  totalPredictions: number;
  joinedAt: Date;
}

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(private prisma: PrismaService) {}

  async calculateMatchScores(matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.status !== 'FINISHED' || match.homeScore === null || match.awayScore === null) {
      return;
    }

    // Buscar todos os palpites não calculados para este jogo
    const predictions = await this.prisma.prediction.findMany({
      where: { matchId, calculated: false },
    });

    for (const prediction of predictions) {
      // Buscar regras do bolão
      const rules = await this.prisma.poolRule.findMany({
        where: { poolId: prediction.poolId },
      });

      const rulesMap = new Map(rules.map((r) => [r.name, r.points]));
      let points = 0;

      const isExactScore =
        prediction.homeScore === match.homeScore &&
        prediction.awayScore === match.awayScore;

      const predictionResult = this.getResult(prediction.homeScore, prediction.awayScore);
      const matchResult = this.getResult(match.homeScore!, match.awayScore!);

      if (isExactScore) {
        points = rulesMap.get('EXACT_SCORE') ?? 5;
      } else if (predictionResult === matchResult) {
        if (matchResult === 'DRAW') {
          points = rulesMap.get('CORRECT_DRAW') ?? 3;
        } else {
          points = rulesMap.get('CORRECT_WINNER') ?? 3;
        }
      } else {
        points = rulesMap.get('WRONG') ?? 0;
      }

      await this.prisma.prediction.update({
        where: { id: prediction.id },
        data: { points, calculated: true },
      });
    }

    this.logger.log(`Pontuações calculadas para jogo ${matchId}: ${predictions.length} palpites`);
  }

  async getRanking(poolId: string): Promise<RankingEntry[]> {
    // Buscar todos os participantes aprovados
    const participants = await this.prisma.poolParticipant.findMany({
      where: { poolId, status: 'APPROVED' },
      include: { user: { select: { id: true, name: true } } },
    });

    // Buscar tiebreakers
    const tiebreakers = await this.prisma.tiebreaker.findMany({
      where: { poolId },
      orderBy: { priority: 'asc' },
    });

    const ranking: RankingEntry[] = [];

    for (const participant of participants) {
      const predictions = await this.prisma.prediction.findMany({
        where: {
          userId: participant.userId,
          poolId,
          calculated: true,
        },
        include: { match: true },
      });

      let totalPoints = 0;
      let exactScores = 0;
      let correctWinners = 0;

      for (const pred of predictions) {
        totalPoints += pred.points;

        if (
          pred.match.homeScore !== null &&
          pred.match.awayScore !== null
        ) {
          if (
            pred.homeScore === pred.match.homeScore &&
            pred.awayScore === pred.match.awayScore
          ) {
            exactScores++;
          } else {
            const predResult = this.getResult(pred.homeScore, pred.awayScore);
            const matchResult = this.getResult(pred.match.homeScore, pred.match.awayScore);
            if (predResult === matchResult) {
              correctWinners++;
            }
          }
        }
      }

      ranking.push({
        userId: participant.userId,
        userName: participant.user.name,
        totalPoints,
        exactScores,
        correctWinners,
        totalPredictions: predictions.length,
        joinedAt: participant.joinedAt,
      });
    }

    // Ordenar por pontos e aplicar tiebreakers
    ranking.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;

      for (const tb of tiebreakers) {
        switch (tb.criteria) {
          case 'MOST_EXACT_SCORES':
            if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
            break;
          case 'MOST_CORRECT_WINNERS':
            if (b.correctWinners !== a.correctWinners) return b.correctWinners - a.correctWinners;
            break;
          case 'EARLIEST_JOIN':
            if (a.joinedAt.getTime() !== b.joinedAt.getTime())
              return a.joinedAt.getTime() - b.joinedAt.getTime();
            break;
        }
      }

      return 0;
    });

    return ranking;
  }

  private getResult(homeScore: number, awayScore: number): 'HOME' | 'AWAY' | 'DRAW' {
    if (homeScore > awayScore) return 'HOME';
    if (homeScore < awayScore) return 'AWAY';
    return 'DRAW';
  }

  /**
   * Retorna palpites de todos os participantes para jogos que já fecharam
   * (status !== SCHEDULED ou matchDate <= now)
   */
  async getClosedPredictions(poolId: string) {
    const now = new Date();

    // Buscar jogos que já fecharam para palpites
    const pool = await this.prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) return [];

    const closedMatches = await this.prisma.match.findMany({
      where: {
        leagueId: pool.leagueId,
        OR: [
          { status: { not: 'SCHEDULED' } },
          { matchDate: { lte: now } },
        ],
      },
      orderBy: { matchDate: 'desc' },
    });

    const matchIds = closedMatches.map((m) => m.id);

    // Buscar todos os palpites desses jogos neste bolão
    const predictions = await this.prisma.prediction.findMany({
      where: {
        poolId,
        matchId: { in: matchIds },
      },
      include: {
        user: { select: { id: true, name: true } },
        match: {
          select: {
            id: true,
            homeTeam: true,
            awayTeam: true,
            homeScore: true,
            awayScore: true,
            status: true,
            matchDate: true,
            round: true,
          },
        },
      },
      orderBy: { match: { matchDate: 'desc' } },
    });

    // Agrupar por jogo
    const byMatch: Record<string, {
      match: any;
      predictions: { userId: string; userName: string; homeScore: number; awayScore: number; points: number }[];
    }> = {};

    for (const pred of predictions) {
      if (!byMatch[pred.matchId]) {
        byMatch[pred.matchId] = {
          match: pred.match,
          predictions: [],
        };
      }
      byMatch[pred.matchId].predictions.push({
        userId: pred.userId,
        userName: pred.user.name,
        homeScore: pred.homeScore,
        awayScore: pred.awayScore,
        points: pred.points,
      });
    }

    return Object.values(byMatch);
  }
}
