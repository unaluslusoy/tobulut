
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller()
@UseGuards(TenantGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // Employees
  @Get('employees')
  getEmployees() { return this.hrService.getEmployees(); }

  @Post('employees')
  createEmployee(@Body() data: any) { return this.hrService.createEmployee(data); }

  @Delete('employees/:id')
  deleteEmployee(@Param('id') id: string) { return this.hrService.deleteEmployee(id); }

  // Payrolls
  @Get('payrolls')
  getPayrolls() { return this.hrService.getPayrolls(); }

  @Post('payrolls/generate')
  generatePayroll(@Body() body: { period: string }) {
      return this.hrService.generateMonthlyPayroll(body.period);
  }

  @Patch('payrolls/:id')
  updatePayroll(@Param('id') id: string, @Body() data: any) { return this.hrService.updatePayroll(id, data); }

  // Leaves
  @Get('leaves')
  getLeaves() { return this.hrService.getLeaves(); }

  @Post('leaves')
  createLeave(@Body() data: any) { return this.hrService.createLeave(data); }
}
