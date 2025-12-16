
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('webhooks')
@UseGuards(TenantGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  findAll() {
    return this.webhooksService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.webhooksService.create(data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webhooksService.remove(id);
  }
}
