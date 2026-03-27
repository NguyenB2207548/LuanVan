import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { ApprovalRequest } from './entities/approval-request.entity';
import { SellerProfile } from './entities/seller-profile.entity';
import { ShipperProfile } from './entities/shipper-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ApprovalRequest, SellerProfile, ShipperProfile])],
  controllers: [UsersController, ApprovalController],
  providers: [UsersService, ApprovalService],
  exports: [UsersService, ApprovalService],
})
export class UsersModule { }
