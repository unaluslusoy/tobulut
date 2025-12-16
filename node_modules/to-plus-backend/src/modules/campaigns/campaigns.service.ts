
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  async findAll() {
    return (this.prisma as any).campaign.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { startDate: 'desc' }
    });
  }

  async create(data: any) {
    return (this.prisma as any).campaign.create({
      data: { ...data, tenantId: this.tenantId }
    });
  }

  async remove(id: string) {
    return (this.prisma as any).campaign.deleteMany({
      where: { id, tenantId: this.tenantId }
    });
  }
}
