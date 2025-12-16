
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { FinanceModule } from './modules/finance/finance.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ServicesModule } from './modules/services/services.module';
import { HrModule } from './modules/hr/hr.module';
import { SaasModule } from './modules/saas/saas.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UsersModule } from './modules/users/users.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OffersModule } from './modules/offers/offers.module';
import { SalesModule } from './modules/sales/sales.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
        ttl: 60000,
        limit: 10,
    }]),
    AuthModule,
    ProductsModule,
    AccountsModule,
    FinanceModule,
    InvoicesModule,
    ServicesModule,
    HrModule,
    SaasModule,
    WebhooksModule,
    ReportsModule,
    UsersModule,
    TasksModule,
    InventoryModule,
    OffersModule,
    SalesModule,
    CampaignsModule,
    NotificationsModule,
    NotificationsModule,
    AdminModule,
    UploadsModule,
  ],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
