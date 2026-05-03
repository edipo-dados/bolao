import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FootballProvider } from './interfaces/football-provider.interface';
import { LeaguesService } from '../leagues/leagues.service';
import { MatchesService } from '../matches/matches.service';
import { RankingService } from '../ranking/ranking.service';
import { MatchStatus } from '@prisma/client';

@Injectable()
export class FootballSyncService {
  private readonly logger = new Logger(FootballSyncService.name);
  private lastSyncTime: Date | null = null;

  constructor(
    @Inject('FOOTBALL_PROVIDER') private footballProvider: FootballProvider,
    private leaguesService: LeaguesService,
    private matchesService: MatchesService,
    private rankingService: RankingService,
  ) {}

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Sync automático a cada 10 minutos.
   * Sincroniza APENAS ligas que têm bolões ativos.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncFixtures() {
    this.logger.log('⏰ Sync automático iniciado...');

    try {
      // Só sincroniza ligas que têm bolões
      const leagues = await this.leaguesService.findWithActivePools();

      if (leagues.length === 0) {
        this.logger.log('Nenhuma liga com bolões ativos, pulando sync');
        return;
      }

      this.logger.log(`Sincronizando ${leagues.length} liga(s) com bolões ativos`);

      for (const league of leagues) {
        try {
          const fixtures = await this.footballProvider.getFixtures(
            league.externalId,
            league.season,
          );

          if (!fixtures || fixtures.length === 0) {
            this.logger.warn(`Nenhum jogo retornado para ${league.name}`);
            continue;
          }

          for (const fixture of fixtures) {
            await this.matchesService.upsert({
              externalId: fixture.externalId,
              leagueId: league.id,
              homeTeam: fixture.homeTeam,
              awayTeam: fixture.awayTeam,
              homeTeamLogo: fixture.homeTeamLogo,
              awayTeamLogo: fixture.awayTeamLogo,
              homeScore: fixture.homeScore ?? undefined,
              awayScore: fixture.awayScore ?? undefined,
              round: fixture.round,
              status: fixture.status as MatchStatus,
              matchDate: fixture.matchDate,
            });
          }

          this.logger.log(`✅ ${fixtures.length} jogos sincronizados para ${league.name}`);
        } catch (err) {
          this.logger.error(`Erro ao sincronizar ${league.name}: ${err}`);
        }
      }

      // Calcular pontuações para jogos recém-finalizados
      const recentlyFinished = await this.matchesService.getRecentlyFinished();
      for (const match of recentlyFinished) {
        await this.rankingService.calculateMatchScores(match.id);
      }

      if (recentlyFinished.length > 0) {
        this.logger.log(`🏆 Pontuações calculadas para ${recentlyFinished.length} jogo(s)`);
      }

      this.lastSyncTime = new Date();
      this.logger.log('✅ Sync automático concluído');
    } catch (error) {
      this.logger.error('❌ Erro no sync automático:', error);
    }
  }

  /**
   * Sincronizar campeonatos da API.
   */
  async syncLeagues(country?: string) {
    const leagues = await this.footballProvider.getLeagues(country);
    const saved: any[] = [];

    for (const league of leagues) {
      const saved_league = await this.leaguesService.upsert(league);
      saved.push(saved_league);
    }

    this.logger.log(`${saved.length} campeonatos sincronizados`);
    return saved;
  }

  /**
   * Sync manual de um campeonato específico.
   */
  async syncLeagueFixtures(leagueId: string) {
    const league = await this.leaguesService.findById(leagueId);
    if (!league) {
      return { error: 'Campeonato não encontrado' };
    }

    const fixtures = await this.footballProvider.getFixtures(
      league.externalId,
      league.season,
    );

    if (!fixtures) {
      return { error: 'Falha ao buscar jogos da API' };
    }

    let count = 0;
    for (const fixture of fixtures) {
      await this.matchesService.upsert({
        externalId: fixture.externalId,
        leagueId: league.id,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        homeTeamLogo: fixture.homeTeamLogo,
        awayTeamLogo: fixture.awayTeamLogo,
        homeScore: fixture.homeScore ?? undefined,
        awayScore: fixture.awayScore ?? undefined,
        round: fixture.round,
        status: fixture.status as MatchStatus,
        matchDate: fixture.matchDate,
      });
      count++;
    }

    return { synced: count, league: league.name };
  }
}
