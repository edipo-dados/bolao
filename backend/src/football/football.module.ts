import { Module } from '@nestjs/common';
import { FootballSyncService } from './football-sync.service';
import { ApiFootballProvider } from './providers/api-football.provider';
import { EspnScraperProvider } from './providers/espn-scraper.provider';
import { LeaguesModule } from '../leagues/leagues.module';
import { MatchesModule } from '../matches/matches.module';
import { RankingModule } from '../ranking/ranking.module';

/**
 * Escolhe o provider automaticamente:
 * - Se FOOTBALL_API_KEY ou RAPIDAPI_KEY estiver configurada → usa ApiFootballProvider
 * - Senão → usa EspnScraperProvider (grátis, sem chave)
 */
const footballProviderFactory = {
  provide: 'FOOTBALL_PROVIDER',
  useFactory: () => {
    if (process.env.FOOTBALL_API_KEY || process.env.RAPIDAPI_KEY) {
      return new ApiFootballProvider();
    }
    return new EspnScraperProvider();
  },
};

@Module({
  imports: [LeaguesModule, MatchesModule, RankingModule],
  providers: [
    ApiFootballProvider,
    EspnScraperProvider,
    footballProviderFactory,
    FootballSyncService,
  ],
  exports: [FootballSyncService, EspnScraperProvider, 'FOOTBALL_PROVIDER'],
})
export class FootballModule {}
