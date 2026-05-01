import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaguesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.league.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.league.findUnique({ where: { id } });
  }

  async upsert(data: {
    externalId: number;
    name: string;
    country?: string;
    logo?: string;
    season: number;
  }) {
    return this.prisma.league.upsert({
      where: { externalId: data.externalId },
      update: { name: data.name, country: data.country, logo: data.logo, season: data.season },
      create: data,
    });
  }

  /** Retorna apenas ligas que têm pelo menos um bolão ativo */
  async findWithActivePools() {
    return this.prisma.league.findMany({
      where: {
        pools: { some: {} },
      },
      orderBy: { name: 'asc' },
    });
  }
}
