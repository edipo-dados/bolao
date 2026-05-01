import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePoolDto {
  @ApiProperty({ example: 'Bolão do Brasileirão 2026' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({ example: 'Bolão entre amigos para o Brasileirão' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['PUBLIC', 'PRIVATE'], default: 'PUBLIC' })
  @IsEnum(['PUBLIC', 'PRIVATE'])
  @IsOptional()
  type?: 'PUBLIC' | 'PRIVATE';

  @ApiProperty({ description: 'ID da liga/campeonato' })
  @IsString()
  leagueId: string;

  @ApiPropertyOptional({ example: 'email@exemplo.com', description: 'Chave PIX' })
  @IsString()
  @IsOptional()
  pixKey?: string;

  @ApiPropertyOptional({ example: 'João Silva', description: 'Nome do titular PIX' })
  @IsString()
  @IsOptional()
  pixName?: string;

  @ApiPropertyOptional({ example: 'R$ 20,00', description: 'Valor da entrada' })
  @IsString()
  @IsOptional()
  entryFee?: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsString()
  @IsOptional()
  contactEmail?: string;
}
