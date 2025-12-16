
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('inventory')
@UseGuards(TenantGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- COLLECTIONS ---
  @Get('collections')
  getCollections() { return this.inventoryService.getCollections(); }

  @Post('collections')
  createCollection(@Body() data: any) { return this.inventoryService.createCollection(data); }

  @Patch('collections/:id')
  updateCollection(@Param('id') id: string, @Body() data: any) { return this.inventoryService.updateCollection(id, data); }

  @Delete('collections/:id')
  deleteCollection(@Param('id') id: string) { return this.inventoryService.deleteCollection(id); }

  // --- STOCK COUNTS ---
  @Get('stock-counts')
  getStockCounts() { return this.inventoryService.getStockCounts(); }

  @Post('stock-counts')
  createStockCount(@Body() data: any) { return this.inventoryService.createStockCount(data); }

  @Patch('stock-counts/:id')
  updateStockCount(@Param('id') id: string, @Body() data: any) { return this.inventoryService.updateStockCount(id, data); }

  // --- PURCHASE ORDERS ---
  @Get('purchase-orders')
  getPurchaseOrders() { return this.inventoryService.getPurchaseOrders(); }

  @Post('purchase-orders')
  createPurchaseOrder(@Body() data: any) { return this.inventoryService.createPurchaseOrder(data); }

  @Patch('purchase-orders/:id')
  updatePurchaseOrder(@Param('id') id: string, @Body() data: any) { return this.inventoryService.updatePurchaseOrder(id, data); }

  // --- TRANSFERS ---
  @Get('transfers')
  getTransfers() { return this.inventoryService.getTransfers(); }

  @Post('transfers')
  createTransfer(@Body() data: any) { return this.inventoryService.createTransfer(data); }

  @Patch('transfers/:id')
  updateTransfer(@Param('id') id: string, @Body() data: any) { return this.inventoryService.updateTransfer(id, data); }
}
