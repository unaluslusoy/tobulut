
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  async create(data: any) {
    const { items, ...invoiceData } = data;
    const tenantId = this.tenantId;

    // Prisma Transaction: Ya hepsi yapılır ya hiçbiri yapılmaz.
    return (this.prisma as any).$transaction(async (tx) => {
        // 1. Faturayı Oluştur
        const invoice = await tx.invoice.create({
            data: {
                ...invoiceData,
                tenantId: tenantId,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId || null,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.total
                    }))
                }
            },
            include: { items: true }
        });

        // 2. Stok Hareketlerini İşle (Satış ise stok düş, alış ise stok arttır)
        const isSales = invoiceData.type === 'sales';
        
        for (const item of items) {
            if (item.productId) {
                // Stok miktarını güncelle
                const quantityChange = isSales ? -item.quantity : item.quantity;
                const movementType = isSales ? 'sale' : 'purchase';

                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: quantityChange } }
                });

                // Stok Hareket Logu Oluştur
                await tx.stockMovement.create({
                    data: {
                        tenantId: tenantId,
                        productId: item.productId,
                        type: movementType,
                        quantity: Math.abs(item.quantity),
                        documentNo: invoice.invoiceNumber,
                        description: `${isSales ? 'Satış' : 'Alış'} Faturası`,
                        performedBy: 'Sistem' // Request user'dan alınabilir
                    }
                });
            }
        }

        // 3. Cari Hesap Bakiyesini Güncelle
        if (invoiceData.accountId) {
            // Satış faturası: Cari borçlanır (Bakiye Artar - Bizim alacağımız)
            // Alış faturası: Cari alacaklanır (Bakiye Düşer - Bizim borcumuz)
            // Not: Bu mantık şirketin muhasebe standardına göre değişebilir.
            // Genelde: Pozitif bakiye = Müşterinin borcu (Bizim Alacağımız)
            //          Negatif bakiye = Bizim borcumuz (Tedarikçi Alacağı)
            
            const balanceChange = isSales ? invoice.total : -invoice.total;

            await tx.account.update({
                where: { id: invoiceData.accountId },
                data: { balance: { increment: balanceChange } }
            });
        }

        return invoice;
    });
  }

  async findAll() {
    return (this.prisma as any).invoice.findMany({
      where: { tenantId: this.tenantId },
      include: { items: true },
      orderBy: { date: 'desc' }
    });
  }

  async findOne(id: string) {
    return (this.prisma as any).invoice.findFirst({
      where: { id, tenantId: this.tenantId },
      include: { items: true }
    });
  }

  async update(id: string, data: any) {
    // Basitleştirilmiş güncelleme
    return (this.prisma as any).invoice.updateMany({
      where: { id, tenantId: this.tenantId },
      data
    });
  }

  async remove(id: string) {
    // Dikkat: Silme işlemi stokları ve bakiyeyi geri almalıdır. (Şimdilik soft delete mantığı)
    return (this.prisma as any).invoice.deleteMany({
      where: { id, tenantId: this.tenantId },
    });
  }
}
