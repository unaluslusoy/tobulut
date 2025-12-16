
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  // Employees
  async getEmployees() {
    return (this.prisma as any).employee.findMany({ where: { tenantId: this.tenantId } });
  }
  async createEmployee(data: any) {
    return (this.prisma as any).employee.create({ data: { ...data, tenantId: this.tenantId } });
  }
  async deleteEmployee(id: string) {
    return (this.prisma as any).employee.deleteMany({ where: { id, tenantId: this.tenantId } });
  }

  // Payrolls
  async getPayrolls() {
    const payrolls = await (this.prisma as any).payroll.findMany({
      where: { employee: { tenantId: this.tenantId } },
      include: { employee: true },
      orderBy: { period: 'desc' }
    });
    return payrolls.map((p: any) => ({
      ...p,
      employeeName: p.employee.name,
      tenantId: this.tenantId
    }));
  }

  async updatePayroll(id: string, data: any) {
    if (data.status === 'paid' && !data.paymentDate) {
        data.paymentDate = new Date().toISOString();
    }
    return (this.prisma as any).payroll.update({ where: { id }, data });
  }

  async generateMonthlyPayroll(period: string) {
      const existing = await (this.prisma as any).payroll.findFirst({
          where: { 
              period,
              employee: { tenantId: this.tenantId }
          }
      });

      if (existing) {
          throw new BadRequestException(`${period} dönemi için bordrolar zaten oluşturulmuş.`);
      }

      const employees = await (this.prisma as any).employee.findMany({
          where: { 
              tenantId: this.tenantId,
              status: 'active'
          }
      });

      if (employees.length === 0) {
          throw new BadRequestException('Aktif personel bulunamadı.');
      }

      const payrollData = employees.map(emp => ({
          tenantId: this.tenantId,
          employeeId: emp.id,
          period: period,
          baseSalary: emp.salary || 0,
          bonus: 0,
          deduction: 0,
          netSalary: emp.salary || 0,
          status: 'pending'
      }));

      return (this.prisma as any).$transaction(
          payrollData.map(p => (this.prisma as any).payroll.create({ data: p }))
      );
  }

  // Leaves
  async getLeaves() {
    const leaves = await (this.prisma as any).leaveRequest.findMany({
      where: { employee: { tenantId: this.tenantId } },
      include: { employee: true },
      orderBy: { startDate: 'desc' }
    });
    return leaves.map((l: any) => ({
      ...l,
      employeeName: l.employee.name,
      tenantId: this.tenantId
    }));
  }
  async createLeave(data: any) {
    const { employeeName, tenantId, ...dbData } = data;
    return (this.prisma as any).leaveRequest.create({ 
        data: { ...dbData, tenantId: this.tenantId } 
    });
  }
}
