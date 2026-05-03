import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { FootballSyncService } from '../football/football-sync.service';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(
    private matchesService: MatchesService,
    private syncService: FootballSyncService,
  ) {}

  @Get('highlights')
  @ApiOperation({ summary: 'Jogos em destaque (ao vivo, hoje e recentes) — público' })
  async getHighlights() {
    const data = await this.matchesService.getHighlights();
    return {
      ...data,
      lastSync: this.syncService.getLastSyncTime(),
    };
  }

  @Get('live/:leagueId')
  @ApiOperation({ summary: 'Jogos ao vivo ou do dia de um campeonato' })
  getLiveMatches(@Param('leagueId') leagueId: string) {
    return this.matchesService.getLiveAndToday(leagueId);
  }

  @Get('sync-status')
  @ApiOperation({ summary: 'Status da última sincronização' })
  getSyncStatus() {
    return { lastSync: this.syncService.getLastSyncTime() };
  }

  @Get('league/:leagueId')
  @ApiOperation({ summary: 'Listar jogos por campeonato' })
  @ApiQuery({ name: 'round', required: false })
  findByLeague(
    @Param('leagueId') leagueId: string,
    @Query('round') round?: string,
  ) {
    return this.matchesService.findByLeague(leagueId, round);
  }

  @Get('league/:leagueId/filter')
  @ApiOperation({ summary: 'Listar jogos com filtros de data e status' })
  @ApiQuery({ name: 'from', required: false, description: 'Data início (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'Data fim (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, description: 'ALL, SCHEDULED, FINISHED, LIVE' })
  findFiltered(
    @Param('leagueId') leagueId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    return this.matchesService.findFiltered(leagueId, { from, to, status });
  }

  @Get('league/:leagueId/upcoming')
  @ApiOperation({ summary: 'Próximos jogos do campeonato' })
  findUpcoming(@Param('leagueId') leagueId: string) {
    return this.matchesService.findUpcoming(leagueId);
  }

  @Get('league/:leagueId/finished')
  @ApiOperation({ summary: 'Jogos finalizados do campeonato' })
  findFinished(@Param('leagueId') leagueId: string) {
    return this.matchesService.findFinished(leagueId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do jogo' })
  findOne(@Param('id') id: string) {
    return this.matchesService.findById(id);
  }
}
