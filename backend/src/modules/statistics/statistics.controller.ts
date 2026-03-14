import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
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
}
