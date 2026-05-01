import { Injectable, Logger } from '@nestjs/common';
import {
  FootballProvider,
  LeagueData,
  MatchData,
} from '../interfaces/football-provider.interface';

/**
 * Provider que usa a API pública da ESPN para buscar resultados de futebol.
 * Não precisa de chave de API — é a mesma API que o site da ESPN consome.
 *
 * Ligas suportadas (slug ESPN → externalId):
 *   bra.1  = Brasileirão Série A (630)
 *   bra.2  = Brasileirão Série B (631)
 *   eng.1  = Premier League (23)
 *   esp.1  = La Liga (15)
 *   ita.1  = Serie A (12)
 *   ger.1  = Bundesliga (10)
 *   fra.1  = Ligue 1 (9)
 *   uefa.champions = Champions League (2)
 *   conmebol.libertadores = Libertadores (11)
 *   bra.copa_do_brasil = Copa do Brasil (632)
 */

export interface EspnLeagueConfig {
  slug: string;
  name: string;
  country: string;
  espnId: number;
}

const SUPPORTED_LEAGUES: EspnLeagueConfig[] = [
  // Brasil
  { slug: 'bra.1', name: 'Brasileirão Série A', country: 'Brazil', espnId: 630 },
  { slug: 'bra.2', name: 'Brasileirão Série B', country: 'Brazil', espnId: 631 },
  { slug: 'bra.copa_do_brasil', name: 'Copa do Brasil', country: 'Brazil', espnId: 632 },
  // Europa - Ligas
  { slug: 'eng.1', name: 'Premier League', country: 'England', espnId: 23 },
  { slug: 'esp.1', name: 'La Liga', country: 'Spain', espnId: 15 },
  { slug: 'ita.1', name: 'Serie A', country: 'Italy', espnId: 12 },
  { slug: 'ger.1', name: 'Bundesliga', country: 'Germany', espnId: 10 },
  { slug: 'fra.1', name: 'Ligue 1', country: 'France', espnId: 9 },
  // Europa - Copas
  { slug: 'uefa.champions', name: 'UEFA Champions League', country: 'Europe', espnId: 2 },
  { slug: 'uefa.europa', name: 'UEFA Europa League', country: 'Europe', espnId: 2310 },
  // América do Sul
  { slug: 'conmebol.libertadores', name: 'Copa Libertadores', country: 'South America', espnId: 11 },
  { slug: 'conmebol.sudamericana', name: 'Copa Sul-Americana', country: 'South America', espnId: 2312 },
  { slug: 'conmebol.america', name: 'Copa América', country: 'South America', espnId: 780 },
  // FIFA
  { slug: 'fifa.world', name: 'Copa do Mundo FIFA', country: 'World', espnId: 606 },
  { slug: 'fifa.worldq.conmebol', name: 'Eliminatórias Copa - CONMEBOL', country: 'South America', espnId: 787 },
  { slug: 'fifa.worldq.uefa', name: 'Eliminatórias Copa - UEFA', country: 'Europe', espnId: 786 },
  { slug: 'fifa.friendly', name: 'Amistosos Internacionais', country: 'World', espnId: 3922 },
];

// Mapeamento de externalId do nosso banco → slug ESPN
const LEAGUE_SLUG_MAP: Record<number, string> = {};
SUPPORTED_LEAGUES.forEach((l) => {
  LEAGUE_SLUG_MAP[l.espnId] = l.slug;
});

@Injectable()
export class EspnScraperProvider implements FootballProvider {
  private readonly logger = new Logger(EspnScraperProvider.name);
  private readonly baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
  private lastRequestTime = 0;
  private readonly minInterval = 500; // ms entre requests

  private async throttledFetch(url: string): Promise<any> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minInterval) {
      await new Promise((resolve) => setTimeout(resolve, this.minInterval - elapsed));
    }
    this.lastRequestTime = Date.now();

    try {
      this.logger.debug(`ESPN fetch: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BolaoBot/1.0)',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.error(`ESPN request failed: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`ESPN request error: ${error}`);
      return null;
    }
  }

  async getLeagues(country?: string): Promise<LeagueData[]> {
    let filtered = SUPPORTED_LEAGUES;
    if (country) {
      filtered = SUPPORTED_LEAGUES.filter(
        (l) => l.country.toLowerCase() === country.toLowerCase(),
      );
    }

    return filtered.map((l) => ({
      externalId: l.espnId,
      name: l.name,
      country: l.country,
      logo: `https://a.espncdn.com/i/leaguelogos/soccer/500/${l.espnId}.png`,
      season: new Date().getFullYear(),
    }));
  }

  async getFixtures(leagueId: number, season: number): Promise<MatchData[]> {
    const slug = LEAGUE_SLUG_MAP[leagueId];
    if (!slug) {
      this.logger.warn(`Liga ${leagueId} não suportada pelo ESPN scraper`);
      return [];
    }

    const allMatches: MatchData[] = [];

    // Buscar scoreboard de hoje (jogos ao vivo e do dia)
    const scoreboard = await this.throttledFetch(
      `${this.baseUrl}/${slug}/scoreboard`,
    );

    if (scoreboard?.events) {
      for (const event of scoreboard.events) {
        const match = this.mapEvent(event, leagueId);
        if (match) allMatches.push(match);
      }
    }

    // Buscar jogos por data — últimos 7 dias e próximos 7 dias
    const dates = this.getDateRange(7, 7);
    for (const date of dates) {
      const data = await this.throttledFetch(
        `${this.baseUrl}/${slug}/scoreboard?dates=${date}`,
      );

      if (data?.events) {
        for (const event of data.events) {
          const match = this.mapEvent(event, leagueId);
          if (match && !allMatches.find((m) => m.externalId === match.externalId)) {
            allMatches.push(match);
          }
        }
      }
    }

    this.logger.log(`ESPN: ${allMatches.length} jogos encontrados para ${slug}`);
    return allMatches;
  }

  async getLiveFixtures(leagueId: number): Promise<MatchData[]> {
    const slug = LEAGUE_SLUG_MAP[leagueId];
    if (!slug) return [];

    const data = await this.throttledFetch(
      `${this.baseUrl}/${slug}/scoreboard`,
    );

    if (!data?.events) return [];

    return data.events
      .map((event: any) => this.mapEvent(event, leagueId))
      .filter((m: MatchData | null) => m && (m.status === 'LIVE' || m.status === 'SCHEDULED'));
  }

  /**
   * Busca resultados de uma data específica.
   * Formato da data: YYYYMMDD
   */
  async getScoresByDate(leagueSlug: string, date: string): Promise<MatchData[]> {
    const league = SUPPORTED_LEAGUES.find((l) => l.slug === leagueSlug);
    if (!league) return [];

    const data = await this.throttledFetch(
      `${this.baseUrl}/${leagueSlug}/scoreboard?dates=${date}`,
    );

    if (!data?.events) return [];

    return data.events
      .map((event: any) => this.mapEvent(event, league.espnId))
      .filter(Boolean) as MatchData[];
  }

  private mapEvent(event: any, leagueId: number): MatchData | null {
    try {
      const competition = event.competitions?.[0];
      if (!competition) return null;

      const homeTeamData = competition.competitors?.find((c: any) => c.homeAway === 'home');
      const awayTeamData = competition.competitors?.find((c: any) => c.homeAway === 'away');

      if (!homeTeamData || !awayTeamData) return null;

      const statusState = competition.status?.type?.state;
      const statusMap: Record<string, string> = {
        pre: 'SCHEDULED',
        in: 'LIVE',
        post: 'FINISHED',
      };

      const homeScore = parseInt(homeTeamData.score) || 0;
      const awayScore = parseInt(awayTeamData.score) || 0;
      const isFinished = statusState === 'post';
      const isLive = statusState === 'in';

      return {
        externalId: parseInt(event.id),
        leagueExternalId: leagueId,
        homeTeam: homeTeamData.team?.displayName || homeTeamData.team?.name || 'TBD',
        awayTeam: awayTeamData.team?.displayName || awayTeamData.team?.name || 'TBD',
        homeTeamLogo: homeTeamData.team?.logo || null,
        awayTeamLogo: awayTeamData.team?.logo || null,
        homeScore: isFinished || isLive ? homeScore : undefined,
        awayScore: isFinished || isLive ? awayScore : undefined,
        round: competition.status?.type?.detail || null,
        status: statusMap[statusState] || 'SCHEDULED',
        matchDate: new Date(event.date),
      };
    } catch (error) {
      this.logger.error(`Erro ao mapear evento ESPN: ${error}`);
      return null;
    }
  }

  private getDateRange(daysBefore: number, daysAfter: number): string[] {
    const dates: string[] = [];
    const now = new Date();

    for (let i = -daysBefore; i <= daysAfter; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      // Formato YYYYMMDD
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      dates.push(`${y}${m}${d}`);
    }

    return dates;
  }

  getSupportedLeagues(): EspnLeagueConfig[] {
    return SUPPORTED_LEAGUES;
  }
}
