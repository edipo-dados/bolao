import {
  Controller,
  Get,
  Delete,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PoolsService } from '../pools/pools.service';
import { MatchesService } from '../matches/matches.service';
import { RankingService } from '../ranking/ranking.service';
import { FootballSyncService } from '../football/football-sync.service';
import { EspnScraperProvider } from '../football/providers/espn-scraper.provider';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateMatchDto } from '../matches/dto/create-match.dto';
import { UpdateMatchDto } from '../matches/dto/update-match.dto';
import { SetResultDto } from '../matches/dto/set-result.dto';
import { CreateLeagueDto } from '../matches/dto/create-league.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private poolsService: PoolsService,
    private matchesService: MatchesService,
    private rankingService: RankingService,
    private footballSyncService: FootballSyncService,
    private espnScraper: EspnScraperProvider,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard do admin' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar usuários' })
  getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Remover usuário' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('pools')
  @ApiOperation({ summary: 'Listar todos os bolões (públicos e privados)' })
  getPools(@Query('search') search?: string) {
    return this.poolsService.findAllAdmin({ search: search || undefined });
  }

  @Get('pools/:id')
  @ApiOperation({ summary: 'Detalhes do bolão (admin)' })
  getPool(@Param('id') id: string) {
    return this.poolsService.findById(id);
  }

  @Put('pools/:id')
  @ApiOperation({ summary: 'Editar bolão (admin)' })
  updatePool(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.poolsService.update(id, user.id, dto);
  }

  @Delete('pools/:id')
  @ApiOperation({ summary: 'Remover bolão' })
  deletePool(@Param('id') id: string, @CurrentUser() user: any) {
    return this.poolsService.delete(id, user.id, true);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Logs de atividade' })
  getLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getActivityLogs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  // --- Gerenciamento manual de campeonatos ---

  @Post('leagues')
  @ApiOperation({ summary: 'Criar campeonato manualmente' })
  createLeague(@Body() dto: CreateLeagueDto) {
    return this.matchesService.createLeague(dto);
  }

  // --- Gerenciamento manual de jogos ---

  @Get('matches/:leagueId')
  @ApiOperation({ summary: 'Listar jogos de um campeonato (admin)' })
  getMatches(
    @Param('leagueId') leagueId: string,
    @Query('page') page?: string,
  ) {
    return this.matchesService.findAllByLeaguePaginated(
      leagueId,
      page ? parseInt(page) : 1,
    );
  }

  @Post('matches')
  @ApiOperation({ summary: 'Criar jogo manualmente' })
  createMatch(@Body() dto: CreateMatchDto) {
    return this.matchesService.createManual({
      leagueId: dto.leagueId,
      homeTeam: dto.homeTeam,
      awayTeam: dto.awayTeam,
      round: dto.round,
      matchDate: new Date(dto.matchDate),
    });
  }

  @Put('matches/:id')
  @ApiOperation({ summary: 'Editar jogo' })
  updateMatch(@Param('id') id: string, @Body() dto: UpdateMatchDto) {
    return this.matchesService.updateMatch(id, {
      ...dto,
      matchDate: dto.matchDate ? new Date(dto.matchDate) : undefined,
    } as any);
  }

  @Post('matches/:id/result')
  @ApiOperation({ summary: 'Inserir resultado do jogo e calcular pontuações' })
  async setResult(@Param('id') id: string, @Body() dto: SetResultDto) {
    const match = await this.matchesService.setResult(id, dto.homeScore, dto.awayScore);
    // Calcular pontuações automaticamente
    await this.rankingService.calculateMatchScores(id);
    return match;
  }

  @Delete('matches/:id')
  @ApiOperation({ summary: 'Remover jogo' })
  deleteMatch(@Param('id') id: string) {
    return this.matchesService.deleteMatch(id);
  }

  // --- Sync com API externa (opcional) ---

  @Post('sync/leagues')
  @ApiOperation({ summary: 'Sincronizar campeonatos da API externa' })
  syncLeagues(@Body() body: { country?: string }) {
    return this.footballSyncService.syncLeagues(body.country);
  }

  @Post('sync/fixtures')
  @ApiOperation({ summary: 'Forçar sincronização de jogos da API externa' })
  syncFixtures() {
    return this.footballSyncService.syncFixtures();
  }

  // --- ESPN Scraper (grátis, sem chave) ---

  @Get('espn/leagues')
  @ApiOperation({ summary: 'Listar campeonatos disponíveis no ESPN' })
  getEspnLeagues() {
    return this.espnScraper.getSupportedLeagues();
  }

  @Post('espn/sync-leagues')
  @ApiOperation({ summary: 'Importar campeonatos do ESPN para o banco' })
  async importEspnLeagues(@Body() body: { country?: string }) {
    const leagues = await this.espnScraper.getLeagues(body.country);
    const saved: any[] = [];
    for (const league of leagues) {
      const l = await this.matchesService.createLeagueIfNotExists({
        externalId: league.externalId,
        name: league.name,
        country: league.country,
        logo: league.logo,
        season: league.season,
      });
      saved.push(l);
    }
    return { imported: saved.length, leagues: saved };
  }

  @Post('espn/sync-fixtures/:leagueId')
  @ApiOperation({ summary: 'Buscar jogos do ESPN e salvar no banco' })
  async syncEspnFixtures(@Param('leagueId') leagueId: string) {
    return this.footballSyncService.syncLeagueFixtures(leagueId);
  }

  @Get('espn/scores/:slug/:date')
  @ApiOperation({ summary: 'Buscar resultados do ESPN por data (YYYYMMDD)' })
  async getEspnScores(
    @Param('slug') slug: string,
    @Param('date') date: string,
  ) {
    return this.espnScraper.getScoresByDate(slug, date);
  }
}
