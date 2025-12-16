"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
let HrService = class HrService {
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    get tenantId() { return this.request.tenantId; }
    async getEmployees() {
        return this.prisma.employee.findMany({ where: { tenantId: this.tenantId } });
    }
    async createEmployee(data) {
        return this.prisma.employee.create({ data: { ...data, tenantId: this.tenantId } });
    }
    async deleteEmployee(id) {
        return this.prisma.employee.deleteMany({ where: { id, tenantId: this.tenantId } });
    }
    async getPayrolls() {
        const payrolls = await this.prisma.payroll.findMany({
            where: { employee: { tenantId: this.tenantId } },
            include: { employee: true },
            orderBy: { period: 'desc' }
        });
        return payrolls.map((p) => ({
            ...p,
            employeeName: p.employee.name,
            tenantId: this.tenantId
        }));
    }
    async updatePayroll(id, data) {
        if (data.status === 'paid' && !data.paymentDate) {
            data.paymentDate = new Date().toISOString();
        }
        return this.prisma.payroll.update({ where: { id }, data });
    }
    async generateMonthlyPayroll(period) {
        const existing = await this.prisma.payroll.findFirst({
            where: {
                period,
                employee: { tenantId: this.tenantId }
            }
        });
        if (existing) {
            throw new common_1.BadRequestException(`${period} dönemi için bordrolar zaten oluşturulmuş.`);
        }
        const employees = await this.prisma.employee.findMany({
            where: {
                tenantId: this.tenantId,
                status: 'active'
            }
        });
        if (employees.length === 0) {
            throw new common_1.BadRequestException('Aktif personel bulunamadı.');
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
        return this.prisma.$transaction(payrollData.map(p => this.prisma.payroll.create({ data: p })));
    }
    async getLeaves() {
        const leaves = await this.prisma.leaveRequest.findMany({
            where: { employee: { tenantId: this.tenantId } },
            include: { employee: true },
            orderBy: { startDate: 'desc' }
        });
        return leaves.map((l) => ({
            ...l,
            employeeName: l.employee.name,
            tenantId: this.tenantId
        }));
    }
    async createLeave(data) {
        const { employeeName, tenantId, ...dbData } = data;
        return this.prisma.leaveRequest.create({
            data: { ...dbData, tenantId: this.tenantId }
        });
    }
};
exports.HrService = HrService;
exports.HrService = HrService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], HrService);
//# sourceMappingURL=hr.service.js.map