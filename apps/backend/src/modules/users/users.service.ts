
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  async findAll() {
    return (this.prisma as any).user.findMany({
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

  async create(data: any) {
    const saltOrRounds = 10;
    const password = data.password || '123456'; 
    const passwordHash = await bcrypt.hash(password, saltOrRounds);
    
    return (this.prisma as any).user.create({
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

  async update(id: string, data: any) {
    // Eğer şifre güncelleniyorsa onu da hashle
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

    return (this.prisma as any).user.updateMany({
      where: { id, tenantId: this.tenantId },
      data: updateData
    });
  }

  async remove(id: string) {
    return (this.prisma as any).user.deleteMany({
      where: { id, tenantId: this.tenantId },
    });
  }
}
