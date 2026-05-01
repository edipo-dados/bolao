import { IsArray, ValidateNested, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TiebreakerDto {
  @ApiProperty({ example: 'MOST_EXACT_SCORES' })
  @IsString()
  criteria: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  priority: number;
}

export class UpdateTiebreakersDto {
  @ApiProperty({ type: [TiebreakerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TiebreakerDto)
  tiebreakers: TiebreakerDto[];
}
