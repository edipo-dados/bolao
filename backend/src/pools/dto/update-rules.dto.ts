import { IsArray, ValidateNested, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class RuleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'EXACT_SCORE' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Acertar placar exato' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  points: number;
}

export class UpdateRulesDto {
  @ApiProperty({ type: [RuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleDto)
  rules: RuleDto[];
}
