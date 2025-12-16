
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  async findAll() {
    return (this.prisma as any).task.findMany({
      where: { tenantId: this.tenantId },
      include: { subtasks: true },
      orderBy: { order: 'asc' }
    });
  }

  async create(data: any) {
    const { subtasks, id: _id, ...taskData } = data;
    
    // Create task along with subtasks
    return (this.prisma as any).task.create({
      data: {
        ...taskData,
        tenantId: this.tenantId,
        subtasks: {
          create: subtasks?.map((st: any) => ({
            text: st.text,
            completed: st.completed
          }))
        }
      },
      include: { subtasks: true }
    });
  }

  async update(id: string, data: any) {
    const { subtasks, id: _id, tenantId: _tid, ...taskData } = data;

    // Pratik güncelleme: Mevcut subtaskları silip yenilerini ekle (Basit yöntem)
    // Gerçek bir uygulamada subtask ID'lerine göre update yapılmalı
    
    // 1. Delete existing subtasks
    await (this.prisma as any).subTask.deleteMany({ where: { taskId: id } });

    // 2. Update task and create new subtasks
    return (this.prisma as any).task.update({
      where: { id, tenantId: this.tenantId },
      data: {
        ...taskData,
        subtasks: {
          create: subtasks?.map((st: any) => ({
            text: st.text,
            completed: st.completed
          }))
        }
      },
      include: { subtasks: true }
    });
  }

  async remove(id: string) {
    return (this.prisma as any).task.deleteMany({
      where: { id, tenantId: this.tenantId },
    });
  }
}
