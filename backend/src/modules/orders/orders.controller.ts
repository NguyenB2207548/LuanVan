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
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  exportService: any;
  constructor(private readonly ordersService: OrdersService) { }

  // --- CUSTOMER ---

  @Post('checkout')
  @Roles(UserRole.USER)
  checkout(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrderFromCart(
      req.user.userId,
      createOrderDto,
    );
  }

  @Get('my-orders')
  @Roles(UserRole.USER)
  getMyOrders(@Request() req, @Query('limit') limit?: string) {
    return this.ordersService.getOrdersByRole('user', req.user.id, 1, limit ? +limit : 10);
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


  // --- SELLER ---

  @Get('seller')
  @Roles(UserRole.SELLER)
  getSellerOrders(@Request() req, @Query('limit') limit?: string) {
    return this.ordersService.getOrdersByRole('seller', req.user.userId, 1, limit ? +limit : 10);
  }
  @Patch(':id/seller-confirm')
  @Roles(UserRole.SELLER)
  confirmOrder(@Param('id', ParseIntPipe) orderId: number, @Request() req) {
    return this.ordersService.sellerConfirmOrder(orderId, req.user.id);
  }

  @Get('seller/stats')
  @UseGuards(JwtAuthGuard)
  async getOrderStats(@Request() req) {
    // req.user.id lấy từ JWT của Seller
    return await this.ordersService.getSellerOrderStats(req.user.id);
  }

  // --- SHIPPER ---

  @Get('shipper/available')
  @Roles(UserRole.SHIPPER)
  getAvailableOrders() {
    return this.ordersService.getAvailableOrdersForShipper();
  }

  @Get('shipper/my-orders')
  @Roles(UserRole.SHIPPER)
  getShipperOrders(@Request() req) {
    return this.ordersService.getOrdersByRole('shipper', req.user.id);
  }

  @Patch('shipper/:id/pickup')
  @Roles(UserRole.SHIPPER)
  pickupOrder(@Param('id', ParseIntPipe) orderId: number, @Request() req) {
    return this.ordersService.shipperPickUpOrder(orderId, req.user.id);
  }

  @Patch('shipper/:id/complete')
  @Roles(UserRole.SHIPPER)
  completeOrder(@Param('id', ParseIntPipe) orderId: number, @Request() req) {
    return this.ordersService.shipperCompleteOrder(orderId, req.user.id);
  }

  @Patch('shipper/:id/fail')
  @Roles(UserRole.SHIPPER)
  async failOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.shipperFailOrder(orderId, req.user.id, reason);
  }

  @Get('shipper/history')
  @Roles(UserRole.SHIPPER)
  getShipperHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.getShipperHistory(
      req.user.id,
      page ? +page : 1,
      limit ? +limit : 10,
    );
  }

  @Get('shipper/stats')
  @Roles(UserRole.SHIPPER)
  getShipperStats(@Request() req) {
    return this.ordersService.getShipperStats(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number, @Req() req: any) {
    return this.ordersService.getOrderDetails(id, {
      id: req.user.userId,
      role: req.user.role,
    });
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

  @Get('seller/customers')
  @Roles(UserRole.SELLER)
  async getMyCustomers(@Request() req, @Query('page') page: number) {
    return this.ordersService.getSellerCustomers(req.user.id, page);
  }

  @Get('seller/customers/stats')
  @Roles(UserRole.SELLER)
  async getMyCustomerStats(@Request() req) {
    return this.ordersService.getSellerCustomerStats(req.user.id);
  }

  // ADMIN
  @Get('admin/stats')
  @Roles(UserRole.ADMIN) // Chỉ Admin mới được xem
  async getAdminStats() {
    return await this.ordersService.getAdminGlobalStats();
  }

  // API lấy danh sách đơn hàng cho Admin
  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async getAllOrdersAdmin(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.findAllOrdersAdmin(page, limit, status, search);
  }

  // API Admin can thiệp trạng thái đơn
  @Patch('admin/:id/force-update-status')
  @Roles(UserRole.ADMIN)
  async forceUpdateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.ordersService.adminForceUpdateStatus(id, status);
  }
}
