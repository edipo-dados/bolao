const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(error.message || `Erro ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(data: { name: string; email: string; password: string }) {
    return this.request<{ user: any; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ user: any; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // User
  async getProfile() {
    return this.request<any>('/users/me');
  }

  async updateProfile(data: { name?: string; avatarUrl?: string }) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Leagues
  async getLeagues() {
    return this.request<any[]>('/leagues');
  }

  // Pools
  async getPublicPools(params?: { search?: string; leagueId?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.leagueId) query.set('leagueId', params.leagueId);
    const qs = query.toString();
    return this.request<any[]>(`/pools/explore${qs ? `?${qs}` : ''}`);
  }

  async getMyPools() {
    return this.request<any[]>('/pools/my');
  }

  async getPool(id: string) {
    return this.request<any>(`/pools/${id}`);
  }

  async getPoolByInvite(code: string) {
    return this.request<any>(`/pools/invite/${code}`);
  }

  async createPool(data: {
    name: string;
    description?: string;
    type?: string;
    leagueId: string;
    pixKey?: string;
    pixName?: string;
    entryFee?: string;
    contactPhone?: string;
    contactEmail?: string;
  }) {
    return this.request<any>('/pools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePool(id: string, data: any) {
    return this.request(`/pools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePool(id: string) {
    return this.request(`/pools/${id}`, { method: 'DELETE' });
  }

  async joinPool(id: string) {
    return this.request(`/pools/${id}/join`, { method: 'POST' });
  }

  async leavePool(id: string) {
    return this.request(`/pools/${id}/leave`, { method: 'POST' });
  }

  async getPendingParticipants(poolId: string) {
    return this.request<any[]>(`/pools/${poolId}/pending`);
  }

  async approveParticipant(poolId: string, participantId: string) {
    return this.request(`/pools/${poolId}/participants/${participantId}/approve`, {
      method: 'POST',
    });
  }

  async rejectParticipant(poolId: string, participantId: string) {
    return this.request(`/pools/${poolId}/participants/${participantId}/reject`, {
      method: 'POST',
    });
  }

  async updatePoolRules(poolId: string, rules: any[]) {
    return this.request(`/pools/${poolId}/rules`, {
      method: 'PUT',
      body: JSON.stringify({ rules }),
    });
  }

  async updatePoolTiebreakers(poolId: string, tiebreakers: any[]) {
    return this.request(`/pools/${poolId}/tiebreakers`, {
      method: 'PUT',
      body: JSON.stringify({ tiebreakers }),
    });
  }

  // Matches
  async getHighlights() {
    return this.request<{ live: any[]; today: any[]; upcoming: any[]; recent: any[] }>('/matches/highlights');
  }

  async getMatchesByLeague(leagueId: string, round?: string) {
    const query = round ? `?round=${encodeURIComponent(round)}` : '';
    return this.request<any[]>(`/matches/league/${leagueId}${query}`);
  }

  async getUpcomingMatches(leagueId: string) {
    return this.request<any[]>(`/matches/league/${leagueId}/upcoming`);
  }

  async getFilteredMatches(leagueId: string, filters?: { from?: string; to?: string; status?: string }) {
    const query = new URLSearchParams();
    if (filters?.from) query.set('from', filters.from);
    if (filters?.to) query.set('to', filters.to);
    if (filters?.status) query.set('status', filters.status);
    const qs = query.toString();
    return this.request<any[]>(`/matches/league/${leagueId}/filter${qs ? `?${qs}` : ''}`);
  }

  async getFinishedMatches(leagueId: string) {
    return this.request<any[]>(`/matches/league/${leagueId}/finished`);
  }

  // Predictions
  async createPrediction(data: {
    matchId: string;
    poolId: string;
    homeScore: number;
    awayScore: number;
  }) {
    return this.request('/predictions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyPredictions(poolId: string) {
    return this.request<any[]>(`/predictions/pool/${poolId}`);
  }

  async getMatchPredictions(matchId: string, poolId: string) {
    return this.request<any[]>(`/predictions/match/${matchId}/pool/${poolId}`);
  }

  async getPredictionHistory() {
    return this.request<any[]>('/predictions/history');
  }

  // Ranking
  async getRanking(poolId: string) {
    return this.request<any[]>(`/ranking/pool/${poolId}`);
  }

  async getRankingPredictions(poolId: string) {
    return this.request<any[]>(`/ranking/pool/${poolId}/predictions`);
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async getUnreadNotifications() {
    return this.request<any[]>('/notifications/unread');
  }

  async getNotificationCount() {
    return this.request<number>('/notifications/count');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'POST' });
  }

  // Admin
  async getAdminDashboard() {
    return this.request<any>('/admin/dashboard');
  }

  async getAdminUsers(page = 1) {
    return this.request<any>(`/admin/users?page=${page}`);
  }

  async deleteUser(id: string) {
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  async getAdminPools(page = 1) {
    return this.request<any[]>(`/admin/pools`);
  }

  async deleteAdminPool(id: string) {
    return this.request(`/admin/pools/${id}`, { method: 'DELETE' });
  }

  async getAdminLogs(page = 1) {
    return this.request<any>(`/admin/logs?page=${page}`);
  }

  async syncLeagues(country?: string) {
    return this.request('/admin/sync/leagues', {
      method: 'POST',
      body: JSON.stringify({ country }),
    });
  }

  async syncFixtures() {
    return this.request('/admin/sync/fixtures', { method: 'POST' });
  }

  // Admin - Gerenciamento manual de campeonatos e jogos
  async createLeague(data: { name: string; country?: string; season: number }) {
    return this.request<any>('/admin/leagues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAdminMatches(leagueId: string, page = 1) {
    return this.request<any>(`/admin/matches/${leagueId}?page=${page}`);
  }

  async createMatch(data: {
    leagueId: string;
    homeTeam: string;
    awayTeam: string;
    round?: string;
    matchDate: string;
  }) {
    return this.request<any>('/admin/matches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMatch(id: string, data: any) {
    return this.request(`/admin/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async setMatchResult(id: string, homeScore: number, awayScore: number) {
    return this.request(`/admin/matches/${id}/result`, {
      method: 'POST',
      body: JSON.stringify({ homeScore, awayScore }),
    });
  }

  async deleteMatch(id: string) {
    return this.request(`/admin/matches/${id}`, { method: 'DELETE' });
  }

  // ESPN Scraper (grátis)
  async getEspnLeagues() {
    return this.request<any[]>('/admin/espn/leagues');
  }

  async importEspnLeagues(country?: string) {
    return this.request<any>('/admin/espn/sync-leagues', {
      method: 'POST',
      body: JSON.stringify({ country }),
    });
  }

  async syncEspnFixtures(leagueId: string) {
    return this.request<any>(`/admin/espn/sync-fixtures/${leagueId}`, {
      method: 'POST',
    });
  }

  async getEspnScores(slug: string, date: string) {
    return this.request<any[]>(`/admin/espn/scores/${slug}/${date}`);
  }
}

export const api = new ApiClient();
