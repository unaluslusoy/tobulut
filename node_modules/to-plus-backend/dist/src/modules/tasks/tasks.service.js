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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
let TasksService = class TasksService {
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    get tenantId() { return this.request.tenantId; }
    async findAll() {
        return this.prisma.task.findMany({
            where: { tenantId: this.tenantId },
            include: { subtasks: true },
            orderBy: { order: 'asc' }
        });
    }
    async create(data) {
        const { subtasks, id: _id, ...taskData } = data;
        return this.prisma.task.create({
            data: {
                ...taskData,
                tenantId: this.tenantId,
                subtasks: {
                    create: subtasks?.map((st) => ({
                        text: st.text,
                        completed: st.completed
                    }))
                }
            },
            include: { subtasks: true }
        });
    }
    async update(id, data) {
        const { subtasks, id: _id, tenantId: _tid, ...taskData } = data;
        await this.prisma.subTask.deleteMany({ where: { taskId: id } });
        return this.prisma.task.update({
            where: { id, tenantId: this.tenantId },
            data: {
                ...taskData,
                subtasks: {
                    create: subtasks?.map((st) => ({
                        text: st.text,
                        completed: st.completed
                    }))
                }
            },
            include: { subtasks: true }
        });
    }
    async remove(id) {
        return this.prisma.task.deleteMany({
            where: { id, tenantId: this.tenantId },
        });
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], TasksService);
//# sourceMappingURL=tasks.service.js.map