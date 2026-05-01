import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Criar super admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bolao.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@bolao.com',
      password: adminPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`✅ Super Admin criado: ${admin.email}`);

  // Criar usuário de teste
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@bolao.com' },
    update: {},
    create: {
      name: 'Usuário Teste',
      email: 'user@bolao.com',
      password: userPassword,
      role: 'USER',
    },
  });
  console.log(`✅ Usuário teste criado: ${user.email}`);

  // Criar campeonatos de exemplo
  const brasileirao = await prisma.league.upsert({
    where: { externalId: 71 },
    update: {},
    create: {
      externalId: 71,
      name: 'Brasileirão Série A',
      country: 'Brazil',
      logo: 'https://media.api-sports.io/football/leagues/71.png',
      season: 2026,
    },
  });

  const champions = await prisma.league.upsert({
    where: { externalId: 2 },
    update: {},
    create: {
      externalId: 2,
      name: 'UEFA Champions League',
      country: 'World',
      logo: 'https://media.api-sports.io/football/leagues/2.png',
      season: 2026,
    },
  });

  const premierLeague = await prisma.league.upsert({
    where: { externalId: 39 },
    update: {},
    create: {
      externalId: 39,
      name: 'Premier League',
      country: 'England',
      logo: 'https://media.api-sports.io/football/leagues/39.png',
      season: 2026,
    },
  });

  console.log('✅ Campeonatos criados');

  // Criar jogos de exemplo
  const now = new Date();
  const matches = [
    {
      externalId: 900001,
      leagueId: brasileirao.id,
      homeTeam: 'Flamengo',
      awayTeam: 'Palmeiras',
      round: 'Rodada 1',
      status: 'SCHEDULED' as const,
      matchDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      externalId: 900002,
      leagueId: brasileirao.id,
      homeTeam: 'Corinthians',
      awayTeam: 'São Paulo',
      round: 'Rodada 1',
      status: 'SCHEDULED' as const,
      matchDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      externalId: 900003,
      leagueId: brasileirao.id,
      homeTeam: 'Grêmio',
      awayTeam: 'Internacional',
      round: 'Rodada 1',
      status: 'FINISHED' as const,
      homeScore: 2,
      awayScore: 1,
      matchDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      externalId: 900004,
      leagueId: brasileirao.id,
      homeTeam: 'Santos',
      awayTeam: 'Botafogo',
      round: 'Rodada 2',
      status: 'SCHEDULED' as const,
      matchDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      externalId: 900005,
      leagueId: champions.id,
      homeTeam: 'Real Madrid',
      awayTeam: 'Manchester City',
      round: 'Quarter-finals',
      status: 'SCHEDULED' as const,
      matchDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const match of matches) {
    await prisma.match.upsert({
      where: { externalId: match.externalId },
      update: {},
      create: match,
    });
  }
  console.log('✅ Jogos de exemplo criados');

  // Criar bolão de exemplo
  const pool = await prisma.pool.create({
    data: {
      name: 'Bolão do Brasileirão 2026',
      description: 'Bolão de exemplo para o Brasileirão Série A 2026',
      type: 'PUBLIC',
      creatorId: admin.id,
      leagueId: brasileirao.id,
      rules: {
        create: [
          { name: 'EXACT_SCORE', description: 'Acertar placar exato', points: 5 },
          { name: 'CORRECT_WINNER', description: 'Acertar vencedor', points: 3 },
          { name: 'CORRECT_DRAW', description: 'Acertar empate', points: 3 },
          { name: 'WRONG', description: 'Errar tudo', points: 0 },
        ],
      },
      tiebreakers: {
        create: [
          { criteria: 'MOST_EXACT_SCORES', priority: 1 },
          { criteria: 'MOST_CORRECT_WINNERS', priority: 2 },
          { criteria: 'EARLIEST_JOIN', priority: 3 },
        ],
      },
      participants: {
        create: [
          { userId: admin.id, role: 'ADMIN', status: 'APPROVED' },
          { userId: user.id, role: 'MEMBER', status: 'APPROVED' },
        ],
      },
    },
  });
  console.log(`✅ Bolão de exemplo criado: ${pool.name}`);

  console.log('\n🎉 Seed concluído!');
  console.log('📧 Admin: admin@bolao.com / admin123');
  console.log('📧 Usuário: user@bolao.com / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
