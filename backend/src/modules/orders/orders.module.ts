import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MomoService } from './momo.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, MomoService],
})
export class OrdersModule {}
