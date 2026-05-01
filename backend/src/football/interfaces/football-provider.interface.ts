export interface LeagueData {
  externalId: number;
  name: string;
  country?: string;
  logo?: string;
  season: number;
}

export interface MatchData {
  externalId: number;
  leagueExternalId: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore?: number;
  awayScore?: number;
  round?: string;
  status: string;
  matchDate: Date;
}

export interface FootballProvider {
  getLeagues(country?: string): Promise<LeagueData[]>;
  getFixtures(leagueId: number, season: number): Promise<MatchData[]>;
  getLiveFixtures(leagueId: number): Promise<MatchData[]>;
}
