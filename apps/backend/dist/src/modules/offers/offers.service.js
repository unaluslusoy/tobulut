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
exports.OffersService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
let OffersService = class OffersService {
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    get tenantId() { return this.request.tenantId; }
    async findAll() {
        return this.prisma.offer.findMany({
            where: { tenantId: this.tenantId },
            include: { items: true },
            orderBy: { date: 'desc' }
        });
    }
    async create(data) {
        const { items, ...offerData } = data;
        return this.prisma.offer.create({
            data: {
                ...offerData,
                tenantId: this.tenantId,
                items: {
                    create: items?.map((item) => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.total,
                        taxRate: item.taxRate,
                        discountRate: item.discountRate
                    }))
                }
            },
            include: { items: true }
        });
    }
    async update(id, data) {
        const { items, id: _id, tenantId: _tid, ...offerData } = data;
        await this.prisma.invoiceItem.deleteMany({ where: { offerId: id } });
        return this.prisma.offer.update({
            where: { id, tenantId: this.tenantId },
            data: {
                ...offerData,
                items: {
                    create: items?.map((item) => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.total,
                        taxRate: item.taxRate,
                        discountRate: item.discountRate
                    }))
                }
            },
            include: { items: true }
        });
    }
    async remove(id) {
        return this.prisma.offer.deleteMany({
            where: { id, tenantId: this.tenantId },
        });
    }
};
exports.OffersService = OffersService;
exports.OffersService = OffersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], OffersService);
//# sourceMappingURL=offers.service.js.map