import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeagueDto {
  @ApiProperty({ example: 'Brasileirão Série A' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Brazil' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  season: number;
}
