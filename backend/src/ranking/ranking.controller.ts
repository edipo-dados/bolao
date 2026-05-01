import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RankingService } from './ranking.service';

@ApiTags('Ranking')
@Controller('ranking')
export class RankingController {
  constructor(private rankingService: RankingService) {}

  @Get('pool/:poolId')
  @ApiOperation({ summary: 'Ranking do bolão' })
  getRanking(@Param('poolId') poolId: string) {
    return this.rankingService.getRanking(poolId);
  }

  @Get('pool/:poolId/predictions')
  @ApiOperation({ summary: 'Palpites de todos os participantes (jogos fechados)' })
  getAllPredictions(@Param('poolId') poolId: string) {
    return this.rankingService.getClosedPredictions(poolId);
  }
}
