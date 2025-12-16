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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
let ServicesService = class ServicesService {
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    get tenantId() { return this.request.tenantId; }
    async create(data) {
        const { parts, history, ...ticketData } = data;
        return this.prisma.serviceTicket.create({
            data: {
                ...ticketData,
                tenantId: this.tenantId,
                parts: {
                    create: parts?.map((part) => ({
                        productId: part.productId,
                        productName: part.productName,
                        quantity: part.quantity,
                        unitPrice: part.unitPrice,
                        total: part.total
                    }))
                },
                history: {
                    create: history?.map((log) => ({
                        action: log.action,
                        user: log.user,
                        date: log.date
                    }))
                }
            },
            include: { parts: true, history: true }
        });
    }
    async findAll() {
        return this.prisma.serviceTicket.findMany({
            where: { tenantId: this.tenantId },
            include: { parts: true, history: true },
            orderBy: { updatedAt: 'desc' }
        });
    }
    async update(id, data) {
        const { parts, history, id: _id, tenantId: _tid, ...ticketData } = data;
        return this.prisma.serviceTicket.update({
            where: { id, tenantId: this.tenantId },
            data: ticketData,
            include: { parts: true, history: true }
        });
    }
    async remove(id) {
        return this.prisma.serviceTicket.deleteMany({
            where: { id, tenantId: this.tenantId },
        });
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], ServicesService);
//# sourceMappingURL=services.service.js.map