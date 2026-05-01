import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMatchDto {
  @ApiProperty()
  @IsString()
  leagueId: string;

  @ApiProperty({ example: 'Flamengo' })
  @IsString()
  homeTeam: string;

  @ApiProperty({ example: 'Palmeiras' })
  @IsString()
  awayTeam: string;

  @ApiPropertyOptional({ example: 'Rodada 1' })
  @IsString()
  @IsOptional()
  round?: string;

  @ApiProperty({ example: '2026-05-10T20:00:00.000Z' })
  @IsDateString()
  matchDate: string;
}
