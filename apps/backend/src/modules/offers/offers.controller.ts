
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OffersService } from './offers.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('offers')
@UseGuards(TenantGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  findAll() {
    return this.offersService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.offersService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.offersService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offersService.remove(id);
  }
}
