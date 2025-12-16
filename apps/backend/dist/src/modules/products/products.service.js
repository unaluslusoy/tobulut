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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProductsService = class ProductsService {
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    get tenantId() {
        return this.request.tenantId;
    }
    async create(createProductDto) {
        return this.prisma.product.create({
            data: {
                ...createProductDto,
                tenantId: this.tenantId,
            },
        });
    }
    async findAll() {
        return this.prisma.product.findMany({
            where: {
                tenantId: this.tenantId,
            },
        });
    }
    async findOne(id) {
        return this.prisma.product.findFirst({
            where: {
                id,
                tenantId: this.tenantId,
            },
        });
    }
    async update(id, updateProductDto) {
        return this.prisma.product.updateMany({
            where: {
                id,
                tenantId: this.tenantId,
            },
            data: updateProductDto,
        });
    }
    async remove(id) {
        return this.prisma.product.deleteMany({
            where: {
                id,
                tenantId: this.tenantId,
            },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], ProductsService);
//# sourceMappingURL=products.service.js.map