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
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard) // Bắt buộc đăng nhập
  // @UseGuards(RolesGuard) // (Khuyên dùng) Guard kiểm tra quyền Admin
  // @Roles('ADMIN')        // (Khuyên dùng) Chỉ Admin mới được gọi
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Get('me')
  getMyOrders(@GetUser('userId') userId: number) {
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard) // Bắt buộc đăng nhập
  getOrderById(@Param('id', ParseIntPipe) orderId: number) {
    return this.ordersService.getOrderById(orderId);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard) // Bắt buộc đăng nhập
  checkout(
    @GetUser('userId') userId: number,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createOrderFromCart(userId, createOrderDto);
  }

  @Get('items/:itemId/design')
  @UseGuards(JwtAuthGuard)
  getOrderItemDesign(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.ordersService.getOrderItemDesign(itemId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateOrderStatus(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, updateOrderStatusDto);
  }

  @Post('momo-ipn')
  async handleMoMoIPN(@Body() body: any, @Res() res: Response) {
    console.log('--- NHẬN WEBHOOK TỪ MOMO ---', body);
    if (body.resultCode === 0) {
      const orderNumber = body.orderId;
      const order = await this.ordersService.findByOrderNumber(orderNumber);
      if (order && order.paymentStatus === 'pending') {
        order.paymentStatus = 'paid';
        order.status = 'processing';
        await this.ordersService.saveOrder(order);
      }
    }

    return res.status(HttpStatus.NO_CONTENT).send();
  }
}
