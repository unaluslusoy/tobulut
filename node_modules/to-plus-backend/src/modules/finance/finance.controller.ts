
import { Controller, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('transactions') // Frontend api.ts dosyasında 'transactions' endpoint'i kullanılıyor
@UseGuards(TenantGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get()
  findAll() {
    return this.financeService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.financeService.create(data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.financeService.remove(id);
  }
}
