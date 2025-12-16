
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  async create(data: any) {
    const { parts, history, ...ticketData } = data;
    
    return (this.prisma as any).serviceTicket.create({
      data: {
        ...ticketData,
        tenantId: this.tenantId,
        parts: {
          create: parts?.map((part: any) => ({
            productId: part.productId,
            productName: part.productName,
            quantity: part.quantity,
            unitPrice: part.unitPrice,
            total: part.total
          }))
        },
        history: {
          create: history?.map((log: any) => ({
            action: log.action,
            user: log.user,
            date: log.date
          }))
        }
      },
      include: { parts: true, history: true }
    });
  }

  async findAll() {
    return (this.prisma as any).serviceTicket.findMany({
      where: { tenantId: this.tenantId },
      include: { parts: true, history: true },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async update(id: string, data: any) {
    const { parts, history, id: _id, tenantId: _tid, ...ticketData } = data;
    
    // Pratik Update: İlişkili kayıtları silip yeniden ekleme (veya upsert) mantığı gerekebilir.
    // Şimdilik ana veriyi güncelleyelim.
    return (this.prisma as any).serviceTicket.update({
      where: { id, tenantId: this.tenantId },
      data: ticketData,
      include: { parts: true, history: true }
    });
  }

  async remove(id: string) {
    return (this.prisma as any).serviceTicket.deleteMany({
      where: { id, tenantId: this.tenantId },
    });
  }
}
