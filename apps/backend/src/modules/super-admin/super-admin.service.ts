
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Tenant, SubscriptionPackage, SystemConfig } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  // --- DASHBOARD ---
  async getDashboardStats() {
    const totalTenants = await this.prisma.tenant.count({
        where: { tag: { not: 'system' } }
    });
    const activeTenants = await this.prisma.tenant.count({
        where: { status: 'active', tag: { not: 'system' } }
    });
    const totalPackages = await this.prisma.subscriptionPackage.count();
    
    // Revenue calculations (simplified)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    const monthlyRevenue = await this.prisma.saaSPayment.aggregate({
        where: { 
            status: 'paid',
            createdAt: { gte: currentMonth }
        },
        _sum: { amount: true }
    });

    const openTickets = await this.prisma.supportTicket.count({
        where: { status: { in: ['open', 'in_progress'] } }
    });

    return {
        totalTenants,
        activeTenants,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        openTickets,
        totalPackages
    };
  }

  // --- TENANTS ---
  async getTenants() {
    return this.prisma.tenant.findMany({
      where: { tag: { not: 'system' } },
      include: {
        subscriptionPackage: true,
        _count: { select: { users: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTenant(id: string) {
      return this.prisma.tenant.findUnique({
          where: { id },
          include: {
              subscriptionPackage: true,
              users: { select: { id: true, name: true, email: true, role: true, status: true }},
              invoices: { take: 5, orderBy: { createdAt: 'desc' } }
          }
      });
  }

  async createTenant(data: any) {
      // Validate uniqueness
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: data.adminEmail }
      });
      if (existingEmail) throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');

      const hashedPassword = await bcrypt.hash(data.adminPassword, 10);

      // Create Tenant & Admin User Transaction
      return this.prisma.$transaction(async (tx) => {
          const tenant = await tx.tenant.create({
              data: {
                  name: data.companyName,
                  type: data.type || 'corporate',
                  taxNumber: data.taxNumber,
                  contactEmail: data.contactEmail || data.adminEmail,
                  subscriptionPlanId: data.packageId,
                  status: 'active',
                  subscriptionStart: new Date(),
                  // 1 Year default for now
                  subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) 
              }
          });

          const user = await tx.user.create({
              data: {
                  tenantId: tenant.id,
                  name: data.adminName || 'Yönetici',
                  email: data.adminEmail,
                  passwordHash: hashedPassword,
                  role: 'admin',
                  isSuperAdmin: false
              }
          });

          return { tenant, user };
      });
  }
  
  async updateTenantStatus(id: string, status: any) {
      return this.prisma.tenant.update({
          where: { id },
          data: { status }
      });
  }

  // --- PACKAGES ---

  async getPackages() {
    const packages = await this.prisma.subscriptionPackage.findMany({
        orderBy: { priceMonthly: 'asc' },
        include: { 
            _count: { select: { tenants: true } },
            modules: { include: { module: true } } 
        }
    });

    return packages.map(pkg => ({
        ...pkg,
        modules: pkg.modules.map(pm => pm.module.code)
    }));
  }

  async savePackage(data: any) {
      const { id, modules, ...packageData } = data;

      return this.prisma.$transaction(async (tx) => {
          const cleanData = {
              name: packageData.name,
              description: packageData.description,
              priceMonthly: packageData.priceMonthly,
              priceYearly: packageData.priceYearly,
              maxUsers: packageData.maxUsers,
              maxProducts: packageData.maxProducts, // New field
              storageLimit: packageData.storageLimit,
              features: packageData.features,
              isPopular: packageData.isPopular,
              isActive: packageData.isActive ?? true
          };

          let pkg;
          if (id && !id.startsWith('new')) {
              // Update scalar fields
              pkg = await tx.subscriptionPackage.update({
                  where: { id },
                  data: cleanData
              });
              
              // Remove existing module links
              await tx.packageModule.deleteMany({ where: { packageId: id } });
          } else {
              // Create new package
              pkg = await tx.subscriptionPackage.create({
                  data: cleanData
              });
          }

          // Link modules
          if (modules && Array.isArray(modules)) {
              for (const moduleCode of modules) {
                  // Ensure module exists in DB
                  let moduleEntity = await tx.module.findUnique({ where: { code: moduleCode } });
                  
                  if (!moduleEntity) {
                      moduleEntity = await tx.module.create({
                          data: {
                              code: moduleCode,
                              name: this.getModuleName(moduleCode),
                              isActive: true
                          }
                      });
                  }

                  // Create relation
                  await tx.packageModule.create({
                      data: {
                          packageId: pkg.id,
                          moduleId: moduleEntity.id
                      }
                  });
              }
          }

          return pkg;
      });
  }

  private getModuleName(code: string): string {
      const names: Record<string, string> = {
        'tasks': 'İş Takibi',
        'calendar': 'Takvim',
        'inventory': 'Stok & Ürünler',
        'service': 'Teknik Servis',
        'pos': 'Hızlı Satış POS',
        'accounts': 'Cari Hesaplar',
        'cash_bank': 'Kasa & Banka',
        'finance': 'Gelir / Gider',
        'invoices': 'Faturalar',
        'offers': 'Teklifler',
        'hr': 'İK Personel',
        'reports': 'Raporlar'
      };
      return names[code] || code;
  }

  // --- PAYMENTS (SAAS) ---
  async getPayments() {
      return this.prisma.saaSPayment.findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
              tenant: { select: { name: true } }
          }
      });
  }

  // --- TICKETS ---
  async getSupportTickets() {
      return this.prisma.supportTicket.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
              tenant: { select: { name: true } }
          }
      });
  }

  async updateTicket(id: string, data: any) {
    return this.prisma.supportTicket.update({
        where: { id },
        data
    });
  }
  // --- ROLES (SUPER ADMIN GROUPS) ---
  async getRoles() {
      return this.prisma.superAdminRole.findMany({
          orderBy: { createdAt: 'asc' },
          include: { _count: { select: { users: true } } }
      });
  }

  async createRole(data: any) {
      // Validate uniqueness
      const existing = await this.prisma.superAdminRole.findUnique({ where: { name: data.name } });
      if (existing) throw new BadRequestException('Bu isimde bir rol zaten mevcut.');

      return this.prisma.superAdminRole.create({
          data: {
              name: data.name,
              description: data.description,
              permissions: data.permissions || []
          }
      });
  }

  async updateRole(id: string, data: any) {
      if (data.name) {
          const existing = await this.prisma.superAdminRole.findFirst({
              where: { name: data.name, id: { not: id } }
          });
          if (existing) throw new BadRequestException('Bu isimde bir rol zaten mevcut.');
      }

      return this.prisma.superAdminRole.update({
          where: { id },
          data: {
              name: data.name,
              description: data.description,
              permissions: data.permissions
          }
      });
  }

  async deleteRole(id: string) {
      // Check if users are assigned
      const role = await this.prisma.superAdminRole.findUnique({
          where: { id },
          include: { _count: { select: { users: true } } }
      });

      if (role && role._count.users > 0) {
          throw new BadRequestException('Bu role atanmış kullanıcılar var. Önce kullanıcıların rolünü değiştirin.');
      }

      return this.prisma.superAdminRole.delete({ where: { id } });
  }

  // --- USERS (SUPER ADMINS) ---
  async getSuperAdmins() {
      return this.prisma.user.findMany({
          where: { role: 'superuser' },
          orderBy: { createdAt: 'desc' },
          include: { superAdminRole: true }
      });
  }

  async createSuperAdmin(data: any) {
      // Validate email uniqueness
      const existing = await this.prisma.user.findFirst({ where: { email: data.email } });
      if (existing) throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');

      const passwordHash = await bcrypt.hash(data.password, 10);

      return this.prisma.user.create({
          data: {
              name: data.name,
              email: data.email,
              passwordHash,
              role: 'superuser',
              isSuperAdmin: true,
              tenantId: 'tenant_system', // Ensure they belong to system tenant
              permissions: {}, // Deprecated in favor of role permissions, but kept for schema compatibility
              status: 'active',
              superAdminRoleId: data.roleId || null
          }
      });
  }

  async updateSuperAdmin(id: string, data: any) {
      const updateData: any = {
          name: data.name,
          email: data.email,
          status: data.status,
          superAdminRoleId: data.roleId
      };

      if (data.password) {
          updateData.passwordHash = await bcrypt.hash(data.password, 10);
      }

      return this.prisma.user.update({
          where: { id },
          data: updateData
      });
  }

  async deleteSuperAdmin(id: string) {
      return this.prisma.user.delete({ where: { id } });
  }
}
