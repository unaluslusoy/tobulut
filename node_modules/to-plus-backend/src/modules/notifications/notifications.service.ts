
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  async findAll() {
    return (this.prisma as any).notification.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { date: 'desc' }
    });
  }

  async markAsRead(id: string) {
    return (this.prisma as any).notification.update({
      where: { id, tenantId: this.tenantId },
      data: { read: true }
    });
  }

  async markAllAsRead() {
    return (this.prisma as any).notification.updateMany({
      where: { tenantId: this.tenantId, read: false },
      data: { read: true }
    });
  }

  async remove(id: string) {
    return (this.prisma as any).notification.deleteMany({
      where: { id, tenantId: this.tenantId }
    });
  }
}
