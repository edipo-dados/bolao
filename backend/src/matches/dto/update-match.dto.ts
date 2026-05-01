import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMatchDto {
  @ApiPropertyOptional({ example: 'Flamengo' })
  @IsString()
  @IsOptional()
  homeTeam?: string;

  @ApiPropertyOptional({ example: 'Palmeiras' })
  @IsString()
  @IsOptional()
  awayTeam?: string;

  @ApiPropertyOptional({ example: 'Rodada 2' })
  @IsString()
  @IsOptional()
  round?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  matchDate?: string;

  @ApiPropertyOptional({ enum: ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED'] })
  @IsEnum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED'])
  @IsOptional()
  status?: string;
}
