
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async seedDatabase() {
    try {
      // 1. Paketleri Oluştur (Varsa oluşturma)
      const existingPackage = await (this.prisma as any).subscriptionPackage.findFirst({ where: { name: 'Professional' }});
      let proPackage = existingPackage;
      
      if (!proPackage) {
        proPackage = await (this.prisma as any).subscriptionPackage.create({
            data: {
            name: 'Professional',
            priceMonthly: 399,
            priceYearly: 3990,
            maxUsers: 10,
            storageLimit: '50GB',
            features: ['Tüm Modüller', 'API Erişimi', 'E-Fatura'],
            modules: ['finance', 'inventory', 'sales', 'hr', 'reports', 'service', 'settings'],
            isPopular: true
            }
        });
      }

      // 2. Demo Tenant Oluştur
      const tenant = await (this.prisma as any).tenant.create({
        data: {
          name: 'Todestek Bilişim A.Ş.',
          contactEmail: 'info@todestek.com',
          subscriptionPlanId: proPackage.id,
          subscriptionStatus: 'active',
          subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }
      });

      // 3. Kullanıcıları Oluştur (Hashlenmiş Şifre ile)
      const passwordHash = await bcrypt.hash('123456', 10);

      await (this.prisma as any).user.createMany({
        data: [
          {
            tenantId: tenant.id,
            name: 'Ahmet Yılmaz (Admin)',
            email: 'ahmet@todestek.com',
            passwordHash,
            role: 'admin',
            status: 'active',
            avatar: 'https://picsum.photos/100/100?random=1',
            allowedModules: []
          },
          {
            tenantId: tenant.id,
            name: 'Zeynep Kaya (Muhasebe)',
            email: 'zeynep@todestek.com',
            passwordHash,
            role: 'accountant',
            status: 'active',
            avatar: 'https://picsum.photos/100/100?random=4',
            allowedModules: ['finance', 'reports']
          }
        ]
      });

      // 4. Ürünler
      await (this.prisma as any).product.createMany({
        data: [
          { tenantId: tenant.id, code: 'LT-2024', name: 'Laptop Pro X1', category: 'Elektronik', stock: 12, price: 24500, currency: 'TRY', status: 'active' },
          { tenantId: tenant.id, code: 'MS-500', name: 'Kablosuz Mouse', category: 'Aksesuar', stock: 85, price: 450, currency: 'TRY', status: 'active' },
          { tenantId: tenant.id, code: 'MN-4K', name: '27" 4K Monitör', category: 'Elektronik', stock: 8, price: 9200, currency: 'TRY', status: 'active' }
        ]
      });

      // 5. Cariler
      await (this.prisma as any).account.createMany({
        data: [
          { tenantId: tenant.id, accountCode: '120.01', type: 'customer', name: 'ABC Mimarlık Ltd.', authorizedPerson: 'Kemal Bey', balance: 15400, status: 'active' },
          { tenantId: tenant.id, accountCode: '320.01', type: 'supplier', name: 'TeknoTedarik A.Ş.', authorizedPerson: 'Fatma Hanım', balance: -45000, status: 'active' }
        ]
      });

      // 6. Kasa
      await (this.prisma as any).cashRegister.create({
        data: { tenantId: tenant.id, name: 'Merkez Kasa', type: 'cash', currency: 'TRY', balance: 12500 }
      });

      return { success: true, message: 'Database seeded successfully', tenantId: tenant.id };
    } catch (error) {
      console.error('Seeding error:', error);
      throw error;
    }
  }
}
