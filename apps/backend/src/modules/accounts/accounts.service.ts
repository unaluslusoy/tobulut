
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  async create(data: any) {
    return (this.prisma as any).account.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  async findAll() {
    return (this.prisma as any).account.findMany({
      where: { tenantId: this.tenantId },
    });
  }

  async findOne(id: string) {
    return (this.prisma as any).account.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async update(id: string, data: any) {
    return (this.prisma as any).account.updateMany({
      where: { id, tenantId: this.tenantId },
      data,
    });
  }

  async remove(id: string) {
    return (this.prisma as any).account.deleteMany({
      where: { id, tenantId: this.tenantId },
    });
  }
}
