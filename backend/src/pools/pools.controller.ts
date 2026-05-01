import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PoolsService } from './pools.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePoolDto } from './dto/create-pool.dto';
import { UpdatePoolDto } from './dto/update-pool.dto';
import { UpdateRulesDto } from './dto/update-rules.dto';
import { UpdateTiebreakersDto } from './dto/update-tiebreakers.dto';

@ApiTags('Pools')
@Controller('pools')
export class PoolsController {
  constructor(private poolsService: PoolsService) {}

  @Get('explore')
  @ApiOperation({ summary: 'Listar bolões públicos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'leagueId', required: false })
  findPublic(
    @Query('search') search?: string,
    @Query('leagueId') leagueId?: string,
  ) {
    return this.poolsService.findAll({ search, leagueId });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar meus bolões' })
  getMyPools(@CurrentUser() user: any) {
    return this.poolsService.getUserPools(user.id);
  }

  @Get('invite/:code')
  @ApiOperation({ summary: 'Buscar bolão por código de convite' })
  findByInvite(@Param('code') code: string) {
    return this.poolsService.findByInviteCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do bolão' })
  findOne(@Param('id') id: string) {
    return this.poolsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar bolão' })
  create(@CurrentUser() user: any, @Body() dto: CreatePoolDto) {
    return this.poolsService.create(user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar bolão' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdatePoolDto,
  ) {
    return this.poolsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir bolão' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.poolsService.delete(id, user.id, user.role === 'SUPER_ADMIN');
  }

  // Participação
  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar entrada no bolão' })
  requestJoin(@Param('id') id: string, @CurrentUser() user: any) {
    return this.poolsService.requestJoin(id, user.id);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sair do bolão' })
  leave(@Param('id') id: string, @CurrentUser() user: any) {
    return this.poolsService.leavePool(id, user.id);
  }

  @Get(':id/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar participantes pendentes' })
  getPending(@Param('id') id: string, @CurrentUser() user: any) {
    return this.poolsService.getPendingParticipants(id, user.id);
  }

  @Post(':id/participants/:participantId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprovar participante' })
  approve(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @CurrentUser() user: any,
  ) {
    return this.poolsService.approveParticipant(id, participantId, user.id);
  }

  @Post(':id/participants/:participantId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejeitar participante' })
  reject(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @CurrentUser() user: any,
  ) {
    return this.poolsService.rejectParticipant(id, participantId, user.id);
  }

  // Regras
  @Put(':id/rules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar regras do bolão' })
  updateRules(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateRulesDto,
  ) {
    return this.poolsService.updateRules(id, user.id, dto.rules);
  }

  @Put(':id/tiebreakers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar critérios de desempate' })
  updateTiebreakers(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateTiebreakersDto,
  ) {
    return this.poolsService.updateTiebreakers(id, user.id, dto.tiebreakers);
  }
}
