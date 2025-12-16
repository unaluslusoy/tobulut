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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReportsService = class ReportsService {
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    get tenantId() { return this.request.tenantId; }
    async getDashboardStats() {
        const tenantId = this.tenantId;
        const [totalReceivables, customerCount, productCount, openTickets, recentTransactions] = await Promise.all([
            this.prisma.account.aggregate({
                where: { tenantId, balance: { gt: 0 } },
                _sum: { balance: true }
            }),
            this.prisma.account.count({
                where: { tenantId, type: 'customer' }
            }),
            this.prisma.product.count({
                where: { tenantId }
            }),
            this.prisma.serviceTicket.count({
                where: { tenantId, status: { not: 'delivered' } }
            }),
            this.prisma.transaction.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ]);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const transactions = await this.prisma.transaction.findMany({
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
            if (!monthlyStats[monthKey])
                monthlyStats[monthKey] = { income: 0, expense: 0 };
            if (t.type === 'income')
                monthlyStats[monthKey].income += Number(t.amount);
            else
                monthlyStats[monthKey].expense += Number(t.amount);
        });
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
            chartData: chartData.length > 0 ? chartData : [{ name: 'Veri Yok', income: 0, expense: 0 }]
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], ReportsService);
//# sourceMappingURL=reports.service.js.map