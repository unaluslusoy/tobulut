
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  // --- COLLECTIONS ---
  async getCollections() {
    return (this.prisma as any).collection.findMany({ where: { tenantId: this.tenantId } });
  }
  async createCollection(data: any) {
    return (this.prisma as any).collection.create({ data: { ...data, tenantId: this.tenantId } });
  }
  async updateCollection(id: string, data: any) {
    return (this.prisma as any).collection.update({ where: { id, tenantId: this.tenantId }, data });
  }
  async deleteCollection(id: string) {
    return (this.prisma as any).collection.deleteMany({ where: { id, tenantId: this.tenantId } });
  }

  // --- STOCK COUNTS (SAYIM) ---
  async getStockCounts() {
    return (this.prisma as any).stockCount.findMany({ where: { tenantId: this.tenantId }, orderBy: { date: 'desc' } });
  }
  
  async createStockCount(data: any) {
    return (this.prisma as any).stockCount.create({ data: { ...data, tenantId: this.tenantId } });
  }

  async updateStockCount(id: string, data: any) {
    const existingCount = await (this.prisma as any).stockCount.findUnique({ where: { id } });
    if (!existingCount) throw new BadRequestException('Sayım kaydı bulunamadı.');

    if (existingCount.status === 'completed') {
        throw new BadRequestException('Bu sayım zaten tamamlanmış, değiştirilemez.');
    }

    if (data.status === 'completed') {
        return (this.prisma as any).$transaction(async (tx) => {
            const updatedCount = await tx.stockCount.update({
                where: { id },
                data
            });

            // Items JSON olarak saklandığı için prisma bunu otomatik işler
            const items: any[] = data.items || existingCount.items || [];
            
            for (const item of items) {
                const diff = Number(item.countedStock) - Number(item.currentStock);
                
                if (diff !== 0) {
                    await tx.stockMovement.create({
                        data: {
                            tenantId: this.tenantId,
                            productId: item.productId,
                            type: diff > 0 ? 'adjustment_inc' : 'adjustment_dec',
                            quantity: Math.abs(diff),
                            documentNo: updatedCount.id,
                            description: `Stok Sayım Farkı`,
                            performedBy: 'Sistem'
                        }
                    });

                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: diff } }
                    });
                }
            }
            return updatedCount;
        });
    }

    return (this.prisma as any).stockCount.update({ where: { id, tenantId: this.tenantId }, data });
  }

  // --- PURCHASE ORDERS (SATIN ALMA) ---
  async getPurchaseOrders() {
    return (this.prisma as any).purchaseOrder.findMany({ where: { tenantId: this.tenantId }, orderBy: { date: 'desc' } });
  }
  
  async createPurchaseOrder(data: any) {
    return (this.prisma as any).purchaseOrder.create({ data: { ...data, tenantId: this.tenantId } });
  }

  async updatePurchaseOrder(id: string, data: any) {
    const existingOrder = await (this.prisma as any).purchaseOrder.findUnique({ where: { id } });
    
    if (data.status === 'received' && existingOrder.status !== 'received') {
        return (this.prisma as any).$transaction(async (tx) => {
            const updatedOrder = await tx.purchaseOrder.update({
                where: { id },
                data
            });

            const items: any[] = data.items || existingOrder.items || [];
            
            for (const item of items) {
                await tx.stockMovement.create({
                    data: {
                        tenantId: this.tenantId,
                        productId: item.productId,
                        type: 'purchase',
                        quantity: Number(item.quantity),
                        documentNo: updatedOrder.id,
                        description: `Satın Alma Siparişi`,
                        performedBy: 'Sistem'
                    }
                });

                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: Number(item.quantity) } }
                });
            }
            
            // Tedarikçi Bakiyesini Düş (Borçlandık)
            if (updatedOrder.supplierId && updatedOrder.totalAmount > 0) {
                 await tx.account.update({
                    where: { id: updatedOrder.supplierId },
                    data: { balance: { decrement: updatedOrder.totalAmount } } 
                });
            }

            return updatedOrder;
        });
    }

    return (this.prisma as any).purchaseOrder.update({ where: { id, tenantId: this.tenantId }, data });
  }

  // --- TRANSFERS ---
  async getTransfers() {
    return (this.prisma as any).transfer.findMany({ where: { tenantId: this.tenantId }, orderBy: { date: 'desc' } });
  }
  async createTransfer(data: any) {
    return (this.prisma as any).transfer.create({ data: { ...data, tenantId: this.tenantId } });
  }
  async updateTransfer(id: string, data: any) {
    return (this.prisma as any).transfer.update({ where: { id, tenantId: this.tenantId }, data });
  }
}
