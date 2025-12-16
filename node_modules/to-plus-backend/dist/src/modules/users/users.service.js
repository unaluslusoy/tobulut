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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    get tenantId() { return this.request.tenantId; }
    async findAll() {
        return this.prisma.user.findMany({
            where: { tenantId: this.tenantId },
            select: {
                id: true,
                tenantId: true,
                name: true,
                email: true,
                role: true,
                status: true,
                lastLogin: true,
                avatar: true,
                allowedModules: true
            }
        });
    }
    async create(data) {
        const saltOrRounds = 10;
        const password = data.password || '123456';
        const passwordHash = await bcrypt.hash(password, saltOrRounds);
        return this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: passwordHash,
                role: data.role,
                tenantId: this.tenantId,
                allowedModules: data.allowedModules || [],
                status: data.status || 'active',
                avatar: data.avatar
            }
        });
    }
    async update(id, data) {
        let updateData = {
            name: data.name,
            email: data.email,
            role: data.role,
            allowedModules: data.allowedModules,
            status: data.status
        };
        if (data.password) {
            const passwordHash = await bcrypt.hash(data.password, 10);
            Object.assign(updateData, { passwordHash });
        }
        return this.prisma.user.updateMany({
            where: { id, tenantId: this.tenantId },
            data: updateData
        });
    }
    async remove(id) {
        return this.prisma.user.deleteMany({
            where: { id, tenantId: this.tenantId },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], UsersService);
//# sourceMappingURL=users.service.js.map