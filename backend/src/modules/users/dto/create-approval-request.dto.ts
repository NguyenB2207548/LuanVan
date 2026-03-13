// create-approval-request.dto.ts
import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateApprovalRequestDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  requestedRole: UserRole;

  @IsOptional()
  @IsString()
  shopName?: string;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;
}
