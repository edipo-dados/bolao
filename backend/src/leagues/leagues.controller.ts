import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeaguesService } from './leagues.service';

@ApiTags('Leagues')
@Controller('leagues')
export class LeaguesController {
  constructor(private leaguesService: LeaguesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar campeonatos disponíveis' })
  findAll() {
    return this.leaguesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do campeonato' })
  findOne(@Param('id') id: string) {
    return this.leaguesService.findById(id);
  }
}
