import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  HttpStatus,
  Res,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard) // Áp dụng bảo vệ cho toàn bộ controller
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // --- CUSTOMER (Người mua) ---

  @Post('checkout')
  @Roles(UserRole.USER)
  checkout(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrderFromCart(req.user.id, createOrderDto);
  }

  @Get('my-orders')
  @Roles(UserRole.USER)
  getMyOrders(@Request() req) {
    return this.ordersService.getOrdersByRole('user', req.user.id);
  }

  // --- SELLER (Người bán) ---

  @Get('seller')
  @Roles(UserRole.SELLER)
  getSellerOrders(@Request() req) {
    return this.ordersService.getOrdersByRole('seller', req.user.id);
  }

  @Patch(':id/seller-confirm')
  @Roles(UserRole.SELLER)
  confirmOrder(@Param('id', ParseIntPipe) orderId: number, @Request() req) {
    return this.ordersService.sellerConfirmOrder(orderId, req.user.id);
  }

  // --- SHIPPER (Người giao hàng) ---

  @Get('shipper-available')
  @Roles(UserRole.SHIPPER)
  getAvailableOrders() {
    return this.ordersService.getAvailableOrdersForShipper();
  }

  @Get('shipper-my-orders')
  @Roles(UserRole.SHIPPER)
  getShipperOrders(@Request() req) {
    return this.ordersService.getOrdersByRole('shipper', req.user.id);
  }

  @Patch(':id/shipper-pickup')
  @Roles(UserRole.SHIPPER)
  pickupOrder(@Param('id', ParseIntPipe) orderId: number, @Request() req) {
    return this.ordersService.shipperPickUpOrder(orderId, req.user.id);
  }

  @Patch(':id/shipper-complete')
  @Roles(UserRole.SHIPPER)
  completeOrder(@Param('id', ParseIntPipe) orderId: number, @Request() req) {
    return this.ordersService.shipperCompleteOrder(orderId, req.user.id);
  }

  // --- CHUNG / ADMIN ---

  @Get(':id')
  getOrderById(@Param('id', ParseIntPipe) orderId: number) {
    return this.ordersService.getOrderById(orderId);
  }

  @Post('momo-ipn')
  async handleMoMoIPN(@Body() body: any, @Res() res: Response) {
    if (body.resultCode === 0) {
      const orderNumber = body.orderId;
      const order = await this.ordersService.findByOrderNumber(orderNumber);

      if (order && order.paymentStatus === 'pending') {
        order.paymentStatus = 'paid';
        await this.ordersService.saveOrder(order);
      }
    }
    return res.status(HttpStatus.NO_CONTENT).send();
  }
}
