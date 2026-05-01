import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [usersCount, poolsCount, predictionsCount, matchesCount] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.pool.count(),
        this.prisma.prediction.count(),
        this.prisma.match.count(),
      ]);

    return {
      users: usersCount,
      pools: poolsCount,
      predictions: predictionsCount,
      matches: matchesCount,
    };
  }

  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { pools: true, predictions: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return { users, total, page, limit };
  }

  async getPools(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [pools, total] = await Promise.all([
      this.prisma.pool.findMany({
        include: {
          creator: { select: { id: true, name: true } },
          league: true,
          _count: { select: { participants: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pool.count(),
    ]);

    return { pools, total, page, limit };
  }

  async getActivityLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        include: { user: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count(),
    ]);

    return { logs, total, page, limit };
  }

  async logActivity(userId: string | null, action: string, details?: string) {
    return this.prisma.activityLog.create({
      data: { userId, action, details },
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
