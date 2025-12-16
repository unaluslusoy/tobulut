
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OffersService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  async findAll() {
    return (this.prisma as any).offer.findMany({
      where: { tenantId: this.tenantId },
      include: { items: true },
      orderBy: { date: 'desc' }
    });
  }

  async create(data: any) {
    const { items, ...offerData } = data;
    return (this.prisma as any).offer.create({
      data: {
        ...offerData,
        tenantId: this.tenantId,
        items: {
          create: items?.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            taxRate: item.taxRate,
            discountRate: item.discountRate
          }))
        }
      },
      include: { items: true }
    });
  }

  async update(id: string, data: any) {
    const { items, id: _id, tenantId: _tid, ...offerData } = data;
    
    // Basit güncelleme: İlişkili kayıtları silip tekrar ekle (veya updateMany mantığı)
    // Gerçek uygulamada transaction kullanılmalı
    await (this.prisma as any).invoiceItem.deleteMany({ where: { offerId: id } }); // Offer items tablosu InvoiceItem ile ortak olabilir veya ayrıdır

    return (this.prisma as any).offer.update({
      where: { id, tenantId: this.tenantId },
      data: {
        ...offerData,
        items: {
          create: items?.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            taxRate: item.taxRate,
            discountRate: item.discountRate
          }))
        }
      },
      include: { items: true }
    });
  }

  async remove(id: string) {
    return (this.prisma as any).offer.deleteMany({
      where: { id, tenantId: this.tenantId },
    });
  }
}
