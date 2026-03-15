import { Controller, Get, Query, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { GetStatsQueryDto } from './dto/get-stats-query.dto';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('seller/dashboard')
  @Roles(UserRole.SELLER)
  async getSellerDashboard(@Req() req: any, @Query() query: GetStatsQueryDto) {
    const sellerId = req.user.id;
    return this.statisticsService.getSellerDashboard(sellerId, query);
  }

  @Get('seller/export-excel')
  @Roles(UserRole.SELLER)
  async exportExcel(@Req() req: any, @Res() res: Response) {
    const sellerId = req.user.id;
    return this.statisticsService.exportOrdersToExcel(sellerId, res as any);
  }

  @Get('admin/export-excel')
  @Roles(UserRole.ADMIN)
  async exportAdminExcel(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Hoặc dùng Express.Response nếu Response bị ghi đè
    return this.statisticsService.exportAdminGlobalReport(
      res as any,
      startDate,
      endDate,
    );
  }
}
