
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  // --- RETURNS ---
  async getReturns() {
    return (this.prisma as any).invoiceReturn.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { date: 'desc' }
    });
  }

  async createReturn(data: any) {
    return (this.prisma as any).invoiceReturn.create({
      data: { ...data, tenantId: this.tenantId }
    });
  }

  async updateReturn(id: string, data: any) {
    return (this.prisma as any).invoiceReturn.update({
      where: { id, tenantId: this.tenantId },
      data
    });
  }

  async deleteReturn(id: string) {
    return (this.prisma as any).invoiceReturn.deleteMany({
      where: { id, tenantId: this.tenantId }
    });
  }

  // --- OFFER CONVERSION ---
  async convertOfferToInvoice(offerId: string) {
      const offer = await (this.prisma as any).offer.findUnique({
          where: { id: offerId, tenantId: this.tenantId },
          include: { items: true }
      });

      if (!offer) throw new NotFoundException('Teklif bulunamadı.');

      return (this.prisma as any).$transaction(async (tx) => {
          await tx.offer.update({
              where: { id: offerId },
              data: { status: 'invoiced' }
          });

          const invoice = await tx.invoice.create({
              data: {
                  tenantId: this.tenantId,
                  invoiceNumber: `INV-${Date.now()}`, // Gerçek seriden alınmalı
                  date: new Date().toISOString(),
                  dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
                  accountId: offer.accountId,
                  accountName: offer.accountName,
                  type: 'sales',
                  status: 'draft',
                  grossTotal: offer.grossTotal,
                  subtotal: offer.subtotal,
                  taxTotal: offer.taxTotal,
                  total: offer.total,
                  currency: offer.currency,
                  items: {
                      create: offer.items.map(item => ({
                          productId: item.productId,
                          productName: item.productName,
                          quantity: item.quantity,
                          unitPrice: item.unitPrice,
                          taxRate: item.taxRate,
                          discountRate: item.discountRate,
                          total: item.total
                      }))
                  }
              }
          });

          return invoice;
      });
  }
}
