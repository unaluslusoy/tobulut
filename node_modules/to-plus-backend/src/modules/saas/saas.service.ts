
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SaasService {
  constructor(private prisma: PrismaService) {}

  // Packages
  async getPackages() {
    return (this.prisma as any).subscriptionPackage.findMany();
  }

  async savePackage(data: any) {
    if (data.id) {
        // Check if exists to determine update vs create (or simplified UPSERT logic)
        const exists = await (this.prisma as any).subscriptionPackage.findUnique({ where: { id: data.id } });
        if (exists) {
            return (this.prisma as any).subscriptionPackage.update({ where: { id: data.id }, data });
        }
    }
    return (this.prisma as any).subscriptionPackage.create({ data });
  }

  // Tenants
  async getTenants() {
    return (this.prisma as any).tenant.findMany({
      include: { subscriptionPlan: true }
    });
  }

  async createTenant(data: any) {
    // data contains tenant fields + admin user fields (email, password, name)
    const { name, contactEmail, subscriptionPlanId, adminEmail, adminPassword, adminName } = data;
    
    // Use transaction to ensure both tenant and admin are created
    // Note: In a real app, use prisma.$transaction
    
    // 1. Create Tenant
    const tenant = await (this.prisma as any).tenant.create({
      data: {
        name,
        contactEmail,
        subscriptionPlanId,
        subscriptionStatus: 'active',
        subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      }
    });

    // 2. Create Admin User for Tenant
    // const hashedPassword = await bcrypt.hash(adminPassword || '123456', 10);
    const hashedPassword = adminPassword || '123456'; // Demo simplicity

    const user = await (this.prisma as any).user.create({
      data: {
        name: adminName || 'Admin',
        email: adminEmail || contactEmail,
        passwordHash: hashedPassword,
        role: 'admin',
        tenantId: tenant.id,
        allowedModules: [] // Full access
      }
    });

    return { tenant, user };
  }

  // Support
  async getTickets() {
    // Fetch all tickets across tenants for Super Admin
    return (this.prisma as any).saaSSupportTicket.findMany({
      include: { tenant: true }
    });
  }

  async updateTicket(id: string, data: any) {
    return (this.prisma as any).saaSSupportTicket.update({
      where: { id },
      data
    });
  }

  // Payments
  async getPayments() {
    return (this.prisma as any).saaSPayment.findMany({
      include: { tenant: true },
      orderBy: { date: 'desc' }
    });
  }
}
