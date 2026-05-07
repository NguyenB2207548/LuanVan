import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  // ----------------------------------------------------------------
  // GET /statistics/seller/revenue-overview
  // Query: ?from=2026-01-01&to=2026-03-31
  // Tổng quan: doanh thu, số đơn, TB mỗi đơn + % so kỳ trước
  // ----------------------------------------------------------------
  @Get('seller/revenue-overview')
  @Roles(UserRole.SELLER)
  async getRevenueOverview(
    @Req() req: any,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
  ) {
    const sellerId = req.user.id;

    // Mặc định: tháng hiện tại
    const now = new Date();
    const from = fromStr
      ? new Date(fromStr)
      : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const to = toStr
      ? new Date(new Date(toStr).setHours(23, 59, 59, 999))
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ. Định dạng: YYYY-MM-DD');
    }

    if (from > to) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    }

    return this.statisticsService.getRevenueOverview(sellerId, from, to);
  }

  // ----------------------------------------------------------------
  // GET /statistics/seller/revenue-chart
  // Query: ?from=2026-01-01&to=2026-03-31&groupBy=day|week|month
  // Dữ liệu biểu đồ đường doanh thu theo thời gian
  // ----------------------------------------------------------------
  @Get('seller/revenue-chart')
  @Roles(UserRole.SELLER)
  async getRevenueChart(
    @Req() req: any,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    const sellerId = req.user.id;

    const now = new Date();
    const from = fromStr
      ? new Date(fromStr)
      : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const to = toStr
      ? new Date(new Date(toStr).setHours(23, 59, 59, 999))
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ. Định dạng: YYYY-MM-DD');
    }

    if (from > to) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    }

    const validGroupBy = ['day', 'week', 'month'];
    const group = validGroupBy.includes(groupBy ?? '')
      ? (groupBy as 'day' | 'week' | 'month')
      : 'day';

    return this.statisticsService.getRevenueChart(sellerId, from, to, group);
  }

  @Get('admin/overview')
  @Roles(UserRole.ADMIN)
  async getAdminOverview() {
    return this.statisticsService.getAdminOverview();
  }

  @Get('admin/revenue-chart')
  @Roles(UserRole.ADMIN)
  async getAdminRevenueChart(
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    const now = new Date();
    const from = fromStr
      ? new Date(fromStr)
      : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const to = toStr
      ? new Date(new Date(toStr).setHours(23, 59, 59, 999))
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ. Định dạng: YYYY-MM-DD');
    }

    const validGroupBy = ['day', 'week', 'month'];
    const group = validGroupBy.includes(groupBy ?? '')
      ? (groupBy as 'day' | 'week' | 'month')
      : 'day';

    return this.statisticsService.getAdminRevenueChart(from, to, group);
  }
}
