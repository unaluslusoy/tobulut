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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs = require("fs");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let UploadsController = class UploadsController {
    uploadFile(folder, file, req) {
        if (!file)
            throw new common_1.BadRequestException('Dosya yüklenemedi.');
        const userId = req.user?.id || 'anonymous';
        return {
            url: `/uploads/${userId}/${folder}/${file.filename}`
        };
    }
    async listFiles(body, req) {
        if (req.user.role !== 'superuser' && req.user.role !== 'admin') {
            if (req.user.role !== 'superuser')
                throw new common_1.ForbiddenException('Yetkisiz erişim');
        }
        const requestedPath = body.path || '';
        if (requestedPath.includes('..'))
            throw new common_1.BadRequestException('Geçersiz yol');
        const fullPath = (0, path_1.join)(process.cwd(), 'uploads', requestedPath);
        if (!fs.existsSync(fullPath)) {
            return [];
        }
        const items = fs.readdirSync(fullPath, { withFileTypes: true });
        return items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file',
            path: requestedPath ? `${requestedPath}/${item.name}` : item.name,
            size: item.isDirectory() ? 0 : fs.statSync((0, path_1.join)(fullPath, item.name)).size
        }));
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':folder'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                const folder = req.params.folder;
                if (!/^[a-z0-9-]+$/.test(folder)) {
                    return cb(new Error('Invalid folder name'), '');
                }
                const userId = req.user?.id || 'anonymous';
                const uploadPath = `./uploads/${userId}/${folder}`;
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            }
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt)$/)) {
                return cb(null, true);
            }
            cb(null, true);
        }
    })),
    __param(0, (0, common_1.Param)('folder')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('admin/list'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "listFiles", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads')
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map