import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePoolDto {
  @ApiPropertyOptional({ example: 'Bolão Atualizado' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['PUBLIC', 'PRIVATE'] })
  @IsEnum(['PUBLIC', 'PRIVATE'])
  @IsOptional()
  type?: 'PUBLIC' | 'PRIVATE';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pixKey?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pixName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entryFee?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactEmail?: string;
}
