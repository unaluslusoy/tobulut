
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  async getDashboardStats() {
    const tenantId = this.tenantId;

    // 1. KPI Kartları için Hızlı Sayımlar
    const [
      totalReceivables,
      customerCount,
      productCount,
      openTickets,
      recentTransactions
    ] = await Promise.all([
      (this.prisma as any).account.aggregate({
        where: { tenantId, balance: { gt: 0 } },
        _sum: { balance: true }
      }),
      (this.prisma as any).account.count({
        where: { tenantId, type: 'customer' }
      }),
      (this.prisma as any).product.count({
        where: { tenantId }
      }),
      (this.prisma as any).serviceTicket.count({
        where: { tenantId, status: { not: 'delivered' } }
      }),
      (this.prisma as any).transaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    // 2. Grafik Verisi (Son 6 Ayın Gelir/Gider Özeti)
    // Prisma henüz raw SQL olmadan gelişmiş time-series group by desteklemiyor,
    // Bu yüzden transaction tablosundan son verileri çekip JS tarafında group yapıyoruz.
    // (Büyük veride raw SQL tercih edilmeli)
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await (this.prisma as any).transaction.findMany({
        where: {
            tenantId,
            createdAt: { gte: sixMonthsAgo }
        },
        select: { createdAt: true, type: true, amount: true }
    });

    const monthlyStats = {};
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    transactions.forEach(t => {
        const d = new Date(t.createdAt);
        const monthKey = months[d.getMonth()];
        if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { income: 0, expense: 0 };
        
        if (t.type === 'income') monthlyStats[monthKey].income += Number(t.amount);
        else monthlyStats[monthKey].expense += Number(t.amount);
    });

    // Chart Data Formatına Çevir
    const chartData = Object.keys(monthlyStats).map(key => ({
        name: key,
        income: monthlyStats[key].income,
        expense: monthlyStats[key].expense
    }));

    return {
      totalReceivables: totalReceivables._sum.balance || 0,
      totalCustomers: customerCount,
      totalProducts: productCount,
      openServiceTickets: openTickets,
      recentTransactions,
      chartData: chartData.length > 0 ? chartData : [{name: 'Veri Yok', income: 0, expense: 0}]
    };
  }
}
