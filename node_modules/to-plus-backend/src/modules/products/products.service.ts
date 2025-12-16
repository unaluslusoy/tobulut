
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any, // Request Scope Injection
  ) {}

  // Helper to get current tenant
  private get tenantId() {
    return this.request.tenantId;
  }

  async create(createProductDto: CreateProductDto) {
    // Tenant ID otomatik olarak eklenir, kullanıcıdan istenmez
    return (this.prisma as any).product.create({
      data: {
        ...createProductDto,
        tenantId: this.tenantId,
      },
    });
  }

  async findAll() {
    // Sadece o anki tenant'ın ürünlerini getirir (Data Isolation)
    return (this.prisma as any).product.findMany({
      where: {
        tenantId: this.tenantId,
      },
    });
  }

  async findOne(id: string) {
    return (this.prisma as any).product.findFirst({
      where: {
        id,
        tenantId: this.tenantId, // Güvenlik kontrolü: Başka tenant verisine erişemez
      },
    });
  }

  async update(id: string, updateProductDto: any) {
    // Önce ürünün bu tenant'a ait olduğunu doğrula (Prisma updateMany ile de yapılabilir)
    return (this.prisma as any).product.updateMany({
      where: {
        id,
        tenantId: this.tenantId,
      },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    return (this.prisma as any).product.deleteMany({
      where: {
        id,
        tenantId: this.tenantId,
      },
    });
  }
}
