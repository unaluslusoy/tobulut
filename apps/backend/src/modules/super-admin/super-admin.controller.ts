
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.superAdminService.getDashboardStats();
  }

  @Get('tenants')
  async getTenants() {
    return this.superAdminService.getTenants();
  }

  @Get('tenants/:id')
  async getTenant(@Param('id') id: string) {
    return this.superAdminService.getTenant(id);
  }

  @Post('tenants')
  async createTenant(@Body() data: any) {
    return this.superAdminService.createTenant(data);
  }

  @Get('packages')
  async getPackages() {
    return this.superAdminService.getPackages();
  }

  @Post('packages')
  async savePackage(@Body() data: any) {
    return this.superAdminService.savePackage(data);
  }

  @Get('payments')
  async getPayments() {
    return this.superAdminService.getPayments();
  }

  @Get('tickets')
  async getTickets() {
    return this.superAdminService.getSupportTickets();
  }
  
  @Put('tickets/:id')
  async updateTicket(@Param('id') id: string, @Body() data: any) {
      return this.superAdminService.updateTicket(id, data);
  }

  // --- ROLES ---
  @Get('roles')
  async getRoles() {
    return this.superAdminService.getRoles();
  }

  @Post('roles')
  async createRole(@Body() data: any) {
    return this.superAdminService.createRole(data);
  }

  @Put('roles/:id')
  async updateRole(@Param('id') id: string, @Body() data: any) {
    return this.superAdminService.updateRole(id, data);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    return this.superAdminService.deleteRole(id);
  }

  @Get('users')
  async getSuperAdmins() {
      return this.superAdminService.getSuperAdmins();
  }

  @Post('users')
  async createSuperAdmin(@Body() data: any) {
      return this.superAdminService.createSuperAdmin(data);
  }

  @Put('users/:id')
  async updateSuperAdmin(@Param('id') id: string, @Body() data: any) {
      return this.superAdminService.updateSuperAdmin(id, data);
  }

  @Delete('users/:id') // Note: Delete import needed
  async deleteSuperAdmin(@Param('id') id: string) {
      return this.superAdminService.deleteSuperAdmin(id);
  }
}
