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
  Req,
  BadRequestException,
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
  exportService: any;
  constructor(private readonly ordersService: OrdersService) {}

  // --- CUSTOMER ---

  @Post('checkout')
  @Roles(UserRole.USER)
  checkout(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    console.log('ID truyền vào service:', req.user.userId);
    return this.ordersService.createOrderFromCart(
      req.user.userId,
      createOrderDto,
    );
  }

  @Get('my-orders')
  @Roles(UserRole.USER)
  getMyOrders(@Request() req) {
    return this.ordersService.getOrdersByRole('user', req.user.id);
  }

  // --- SELLER ---

  @Get('seller')
  @Roles(UserRole.SELLER)
  getSellerOrders(@Request() req) {
    return this.ordersService.getOrdersByRole('seller', req.user.userId);
  }

  @Patch(':id/seller-confirm')
  @Roles(UserRole.SELLER)
  confirmOrder(@Param('id', ParseIntPipe) orderId: number, @Request() req) {
    return this.ordersService.sellerConfirmOrder(orderId, req.user.id);
  }

  // --- SHIPPER ---

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

  // ---  ADMIN ---

  // @Get(':id')
  // getOrderById(@Param('id', ParseIntPipe) orderId: number) {
  //   return this.ordersService.getOrderById(orderId);
  // }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number, @Req() req: any) {
    return this.ordersService.getOrderDetails(id, {
      id: req.user.userId,
      role: req.user.role,
    });
  }

  @Patch(':id/cancel')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async cancelOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.cancelOrder(orderId, req.user.id, req.user.role);
  }

  @Patch(':id/shipper-fail')
  @Roles(UserRole.SHIPPER)
  async failOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.shipperFailOrder(orderId, req.user.id, reason);
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

  @Get(':id/export-print-file')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async exportPrintFile(
    @Param('id', ParseIntPipe) orderItemId: number,
    @Res() res: Response,
  ) {
    // 1. Lấy dữ liệu (Lúc này orderItem sẽ có kiểu là OrderItem entity)
    const orderItem =
      await this.ordersService.getOrderItemWithDesign(orderItemId);

    // 2. Kiểm tra dữ liệu cấu hình in
    const printArea = orderItem.variant?.mockup?.printArea;

    if (!printArea || !orderItem.customizedDesignJson) {
      throw new BadRequestException(
        'Đơn hàng này thiếu thông tin cấu hình in ấn (Mockup/PrintArea/Json)',
      );
    }

    // 3. Gọi service render
    const imageBuffer = await this.exportService.renderHighResImage(
      orderItem.customizedDesignJson,
      printArea,
    );

    // 4. Trả về file
    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=print-file-${orderItemId}.png`,
    );
    res.send(imageBuffer);
  }
}
