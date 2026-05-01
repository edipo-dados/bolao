import { Injectable, Logger } from '@nestjs/common';
import {
  FootballProvider,
  LeagueData,
  MatchData,
} from '../interfaces/football-provider.interface';

@Injectable()
export class ApiFootballProvider implements FootballProvider {
  private readonly logger = new Logger(ApiFootballProvider.name);
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private lastRequestTime = 0;
  private readonly minInterval = 1200; // ms entre requests (rate limit)
  private dailyRequests = 0;
  private dailyResetDate = new Date().toDateString();

  constructor() {
    const apiKey = process.env.FOOTBALL_API_KEY || '';
    const useRapidApi = !!process.env.RAPIDAPI_KEY;

    if (useRapidApi) {
      // Via RapidAPI
      this.baseUrl = 'https://api-football-v1.p.rapidapi.com/v3';
      this.headers = {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
      };
    } else {
      // Via api-football.com direto (plano free: 100 req/dia)
      this.baseUrl = 'https://v3.football.api-sports.io';
      this.headers = {
        'x-apisports-key': apiKey,
      };
    }
  }

  private checkDailyLimit(): boolean {
    const today = new Date().toDateString();
    if (today !== this.dailyResetDate) {
      this.dailyRequests = 0;
      this.dailyResetDate = today;
    }
    // Plano free: 100 requests/dia — reservar margem
    if (this.dailyRequests >= 95) {
      this.logger.warn('Limite diário de requests quase atingido, pulando chamada');
      return false;
    }
    return true;
  }

  private async throttledFetch(url: string): Promise<any> {
    if (!this.checkDailyLimit()) return null;

    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minInterval) {
      await new Promise((resolve) => setTimeout(resolve, this.minInterval - elapsed));
    }
    this.lastRequestTime = Date.now();
    this.dailyRequests++;

    try {
      this.logger.debug(`API request: ${url} (req #${this.dailyRequests} hoje)`);
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        this.logger.error(`API request failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      // Log de rate limit restante (header da API-Sports)
      const remaining = response.headers.get('x-ratelimit-requests-remaining');
      if (remaining) {
        this.logger.debug(`Requests restantes hoje: ${remaining}`);
      }

      if (data.errors && Object.keys(data.errors).length > 0) {
        this.logger.error(`API errors: ${JSON.stringify(data.errors)}`);
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error(`API request error: ${error}`);
      return null;
    }
  }

  async getLeagues(country?: string): Promise<LeagueData[]> {
    const params = country ? `?country=${encodeURIComponent(country)}` : '';
    const data = await this.throttledFetch(`${this.baseUrl}/leagues${params}`);

    if (!data?.response) return [];

    return data.response.map((item: any) => ({
      externalId: item.league.id,
      name: item.league.name,
      country: item.country?.name,
      logo: item.league.logo,
      season: item.seasons?.[item.seasons.length - 1]?.year || new Date().getFullYear(),
    }));
  }

  async getFixtures(leagueId: number, season: number): Promise<MatchData[]> {
    const data = await this.throttledFetch(
      `${this.baseUrl}/fixtures?league=${leagueId}&season=${season}`,
    );

    if (!data?.response) return [];

    return data.response.map((item: any) => this.mapFixture(item));
  }

  async getLiveFixtures(leagueId: number): Promise<MatchData[]> {
    const data = await this.throttledFetch(
      `${this.baseUrl}/fixtures?league=${leagueId}&live=all`,
    );

    if (!data?.response) return [];

    return data.response.map((item: any) => this.mapFixture(item));
  }

  private mapFixture(item: any): MatchData {
    const statusMap: Record<string, string> = {
      TBD: 'SCHEDULED',
      NS: 'SCHEDULED',
      '1H': 'LIVE',
      HT: 'LIVE',
      '2H': 'LIVE',
      ET: 'LIVE',
      P: 'LIVE',
      FT: 'FINISHED',
      AET: 'FINISHED',
      PEN: 'FINISHED',
      PST: 'POSTPONED',
      CANC: 'CANCELLED',
      ABD: 'CANCELLED',
      AWD: 'FINISHED',
      WO: 'FINISHED',
    };

    return {
      externalId: item.fixture.id,
      leagueExternalId: item.league.id,
      homeTeam: item.teams.home.name,
      awayTeam: item.teams.away.name,
      homeTeamLogo: item.teams.home.logo,
      awayTeamLogo: item.teams.away.logo,
      homeScore: item.goals.home,
      awayScore: item.goals.away,
      round: item.league.round,
      status: statusMap[item.fixture.status.short] || 'SCHEDULED',
      matchDate: new Date(item.fixture.date),
    };
  }
}
