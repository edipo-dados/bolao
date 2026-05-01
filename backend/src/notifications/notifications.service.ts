import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  /** Notificar todos os admins de um bolão */
  async notifyPoolAdmins(poolId: string, type: string, title: string, message: string) {
    const admins = await this.prisma.poolParticipant.findMany({
      where: { poolId, role: 'ADMIN', status: 'APPROVED' },
      select: { userId: true },
    });

    for (const admin of admins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.userId,
          type,
          title,
          message,
          link: `/pools/${poolId}`,
        },
      });
    }
  }

  async getUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
