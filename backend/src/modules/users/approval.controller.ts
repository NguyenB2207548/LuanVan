import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { CreateApprovalRequestDto } from './dto/create-approval-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RequestStatus } from './entities/approval-request.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @UseGuards(JwtAuthGuard)
  @Post('request')
  async createRequest(
    @GetUser('userId') userId: number,
    @Body() createDto: CreateApprovalRequestDto,
  ) {
    return this.approvalService.create(userId, createDto);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPendingRequests() {
    return this.approvalService.findAllPending();
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async approve(@Param('id') id: number) {
    return this.approvalService.approveRequest(id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async reject(@Param('id') id: number) {
    return this.approvalService.updateStatus(id, RequestStatus.REJECTED);
  }
}
