
import { Controller, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('campaigns')
@UseGuards(TenantGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  findAll() {
    return this.campaignsService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.campaignsService.create(data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }
}
