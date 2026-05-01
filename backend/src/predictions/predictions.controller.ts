import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PredictionsService } from './predictions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePredictionDto } from './dto/create-prediction.dto';

@ApiTags('Predictions')
@Controller('predictions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PredictionsController {
  constructor(private predictionsService: PredictionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar/atualizar palpite' })
  create(@CurrentUser() user: any, @Body() dto: CreatePredictionDto) {
    return this.predictionsService.create(user.id, dto);
  }

  @Get('pool/:poolId')
  @ApiOperation({ summary: 'Meus palpites no bolão' })
  getMyPredictions(
    @CurrentUser() user: any,
    @Param('poolId') poolId: string,
  ) {
    return this.predictionsService.getUserPredictions(user.id, poolId);
  }

  @Get('match/:matchId/pool/:poolId')
  @ApiOperation({ summary: 'Palpites de um jogo no bolão' })
  getMatchPredictions(
    @Param('matchId') matchId: string,
    @Param('poolId') poolId: string,
  ) {
    return this.predictionsService.getMatchPredictions(matchId, poolId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Histórico de palpites' })
  getHistory(@CurrentUser() user: any) {
    return this.predictionsService.getUserPredictionHistory(user.id);
  }
}
