import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { ApprovalRequest } from './entities/approval-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ApprovalRequest])],
  controllers: [UsersController, ApprovalController],
  providers: [UsersService, ApprovalService],
  exports: [UsersService, ApprovalService],
})
export class UsersModule {}
