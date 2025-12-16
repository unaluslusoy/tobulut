
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('reports')
@UseGuards(TenantGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }
  
  // Gelecekte eklenecek diğer rapor endpointleri
  // @Get('sales')
  // @Get('inventory')
}
