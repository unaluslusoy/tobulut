
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SaasService } from './saas.service';
// SuperAdminGuard should be implemented to protect these routes
// For now, we assume public or standard auth for demo

@Controller() 
export class SaasController {
  constructor(private readonly saasService: SaasService) {}

  @Get('packages')
  getPackages() {
    return this.saasService.getPackages();
  }

  @Post('packages')
  createPackage(@Body() data: any) {
    return this.saasService.savePackage(data);
  }

  @Patch('packages/:id')
  updatePackage(@Param('id') id: string, @Body() data: any) {
    return this.saasService.savePackage({ ...data, id });
  }

  @Get('tenants')
  getTenants() {
    return this.saasService.getTenants();
  }

  @Post('tenants')
  createTenant(@Body() data: any) {
    // data includes tenant info and initial admin user
    return this.saasService.createTenant(data);
  }

  @Get('support-tickets')
  getTickets() {
    return this.saasService.getTickets();
  }

  @Patch('support-tickets/:id')
  updateTicket(@Param('id') id: string, @Body() data: any) {
    return this.saasService.updateTicket(id, data);
  }

  @Get('payments')
  getPayments() {
    return this.saasService.getPayments();
  }
}
