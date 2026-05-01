import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchStatus } from '@prisma/client';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async findByLeague(leagueId: string, round?: string) {
    const where: any = { leagueId };
    if (round) where.round = round;

    return this.prisma.match.findMany({
      where,
      orderBy: { matchDate: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.match.findUnique({ where: { id } });
  }

  /**
   * Retorna jogos em destaque para a home page (público):
   * - Jogos ao vivo
   * - Jogos de hoje (agendados ou finalizados)
   * - Últimos jogos finalizados (se não tiver nada hoje)
   */
  async getHighlights() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Jogos ao vivo
    const live = await this.prisma.match.findMany({
      where: { status: 'LIVE' },
      include: { league: { select: { name: true, logo: true } } },
      orderBy: { matchDate: 'asc' },
    });

    // Jogos de hoje
    const today = await this.prisma.match.findMany({
      where: {
        matchDate: { gte: startOfDay, lt: endOfDay },
        status: { not: 'LIVE' },
      },
      include: { league: { select: { name: true, logo: true } } },
      orderBy: { matchDate: 'asc' },
      take: 10,
    });

    // Se não tem jogos hoje, pega os próximos agendados
    let upcoming: any[] = [];
    if (live.length === 0 && today.length === 0) {
      upcoming = await this.prisma.match.findMany({
        where: {
          status: 'SCHEDULED',
          matchDate: { gt: now },
        },
        include: { league: { select: { name: true, logo: true } } },
        orderBy: { matchDate: 'asc' },
        take: 6,
      });
    }

    // Últimos finalizados (sempre mostra alguns)
    const recent = await this.prisma.match.findMany({
      where: { status: 'FINISHED' },
      include: { league: { select: { name: true, logo: true } } },
      orderBy: { matchDate: 'desc' },
      take: 6,
    });

    return { live, today, upcoming, recent };
  }

  async findFiltered(leagueId: string, filters?: { from?: string; to?: string; status?: string }) {
    const where: any = { leagueId };

    if (filters?.from || filters?.to) {
      where.matchDate = {};
      if (filters.from) where.matchDate.gte = new Date(filters.from);
      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        where.matchDate.lte = toDate;
      }
    }

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    return this.prisma.match.findMany({
      where,
      orderBy: { matchDate: 'desc' },
      take: 100,
    });
  }

  async findUpcoming(leagueId: string, limit = 20) {
    return this.prisma.match.findMany({
      where: {
        leagueId,
        status: 'SCHEDULED',
        matchDate: { gte: new Date() },
      },
      orderBy: { matchDate: 'asc' },
      take: limit,
    });
  }

  async findFinished(leagueId: string, limit = 20) {
    return this.prisma.match.findMany({
      where: {
        leagueId,
        status: 'FINISHED',
      },
      orderBy: { matchDate: 'desc' },
      take: limit,
    });
  }

  async upsert(data: {
    externalId: number;
    leagueId: string;
    homeTeam: string;
    awayTeam: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
    homeScore?: number;
    awayScore?: number;
    round?: string;
    status: MatchStatus;
    matchDate: Date;
  }) {
    return this.prisma.match.upsert({
      where: { externalId: data.externalId },
      update: {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        status: data.status,
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        homeTeamLogo: data.homeTeamLogo,
        awayTeamLogo: data.awayTeamLogo,
        round: data.round,
        matchDate: data.matchDate,
      },
      create: data,
    });
  }

  async getRecentlyFinished() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return this.prisma.match.findMany({
      where: {
        status: 'FINISHED',
        updatedAt: { gte: thirtyMinutesAgo },
      },
    });
  }

  // --- CRUD Manual (admin) ---

  async createManual(data: {
    leagueId: string;
    homeTeam: string;
    awayTeam: string;
    round?: string;
    matchDate: Date;
  }) {
    // Gerar externalId negativo para jogos manuais (não conflitar com API)
    const lastManual = await this.prisma.match.findFirst({
      where: { externalId: { lt: 0 } },
      orderBy: { externalId: 'asc' },
    });
    const externalId = lastManual ? lastManual.externalId - 1 : -1;

    return this.prisma.match.create({
      data: {
        externalId,
        leagueId: data.leagueId,
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        round: data.round,
        status: 'SCHEDULED',
        matchDate: new Date(data.matchDate),
      },
    });
  }

  async updateMatch(id: string, data: {
    homeTeam?: string;
    awayTeam?: string;
    round?: string;
    matchDate?: Date;
    status?: MatchStatus;
  }) {
    const updateData: any = { ...data };
    if (data.matchDate) updateData.matchDate = new Date(data.matchDate);
    return this.prisma.match.update({ where: { id }, data: updateData });
  }

  async setResult(id: string, homeScore: number, awayScore: number) {
    return this.prisma.match.update({
      where: { id },
      data: {
        homeScore,
        awayScore,
        status: 'FINISHED',
      },
    });
  }

  async deleteMatch(id: string) {
    // Deletar palpites associados primeiro
    await this.prisma.prediction.deleteMany({ where: { matchId: id } });
    return this.prisma.match.delete({ where: { id } });
  }

  async findAllByLeaguePaginated(leagueId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [matches, total] = await Promise.all([
      this.prisma.match.findMany({
        where: { leagueId },
        orderBy: { matchDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.match.count({ where: { leagueId } }),
    ]);
    return { matches, total, page, limit };
  }

  async createLeague(data: {
    name: string;
    country?: string;
    season: number;
  }) {
    // Gerar externalId negativo para ligas manuais
    const lastManual = await this.prisma.$queryRaw<any[]>`
      SELECT "externalId" FROM leagues WHERE "externalId" < 0 ORDER BY "externalId" ASC LIMIT 1
    `;
    const externalId = lastManual.length > 0 ? lastManual[0].externalId - 1 : -1;

    return this.prisma.league.create({
      data: {
        externalId,
        name: data.name,
        country: data.country,
        season: data.season,
      },
    });
  }

  async createLeagueIfNotExists(data: {
    externalId: number;
    name: string;
    country?: string;
    logo?: string;
    season: number;
  }) {
    return this.prisma.league.upsert({
      where: { externalId: data.externalId },
      update: { name: data.name, country: data.country, logo: data.logo, season: data.season },
      create: data,
    });
  }
}
