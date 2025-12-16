
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  async findAll() {
    return (this.prisma as any).transaction.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { date: 'desc' }
    });
  }

  async create(data: any) {
    return (this.prisma as any).$transaction(async (tx) => {
        // 1. İşlemi Kaydet
        const transaction = await tx.transaction.create({
            data: { ...data, tenantId: this.tenantId },
        });

        // 2. Kasa Bakiyesini Güncelle
        // Gelir ise kasa artar, Gider ise kasa azalır
        const registerChange = data.type === 'income' ? data.amount : -data.amount;
        
        await tx.cashRegister.update({
            where: { id: data.registerId },
            data: { balance: { increment: registerChange } }
        });

        // 3. Cari Hesap Varsa Bakiyesini Güncelle
        if (data.accountId) {
            // Tahsilat (Gelir): Müşteri borcu düşer (Bakiye azalır)
            // Tediye (Gider): Tedarikçi alacağı düşer (Bakiye artar/sıfıra yaklaşır)
            // Bu mantık "Bakiye = Müşteri Borcu" kabulüne göredir.
            const accountChange = data.type === 'income' ? -data.amount : data.amount;

            await tx.account.update({
                where: { id: data.accountId },
                data: { balance: { increment: accountChange } }
            });
        }

        return transaction;
    });
  }

  async remove(id: string) {
    // İşlem silindiğinde bakiyelerin de geri alınması gerekir (Gelişmiş versiyon için TODO)
    return (this.prisma as any).transaction.deleteMany({
      where: { id, tenantId: this.tenantId },
    });
  }
}
