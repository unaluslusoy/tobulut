
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('sales')
@UseGuards(TenantGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // Returns
  @Get('returns')
  getReturns() {
    return this.salesService.getReturns();
  }

  @Post('returns')
  createReturn(@Body() data: any) {
    return this.salesService.createReturn(data);
  }

  @Patch('returns/:id')
  updateReturn(@Param('id') id: string, @Body() data: any) {
    return this.salesService.updateReturn(id, data);
  }

  @Delete('returns/:id')
  deleteReturn(@Param('id') id: string) {
    return this.salesService.deleteReturn(id);
  }

  // Offers
  @Post('offers/:id/convert')
  convertOffer(@Param('id') id: string) {
      return this.salesService.convertOfferToInvoice(id);
  }
}
