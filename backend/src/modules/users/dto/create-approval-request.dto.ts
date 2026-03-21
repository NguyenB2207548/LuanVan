import { IsEnum, IsOptional, IsString, IsNotEmpty, ValidateIf } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity'; // Kiểm tra lại đường dẫn này

export class CreateApprovalRequestDto {
  @IsEnum(UserRole, { message: 'Vai trò yêu cầu không hợp lệ' })
  @IsNotEmpty({ message: 'Vai trò yêu cầu không được để trống' })
  requestedRole: UserRole;

  // --- DỮ LIỆU DÀNH CHO SELLER ---
  @ValidateIf((o) => o.requestedRole === UserRole.SELLER)
  @IsNotEmpty({ message: 'Tên cửa hàng là bắt buộc khi đăng ký Seller' })
  @IsString()
  shopName?: string;

  @ValidateIf((o) => o.requestedRole === UserRole.SELLER)
  @IsNotEmpty({ message: 'Địa chỉ cửa hàng là bắt buộc khi đăng ký Seller' })
  @IsString()
  shopAddress?: string;

  // --- DỮ LIỆU DÀNH CHO SHIPPER ---
  @ValidateIf((o) => o.requestedRole === UserRole.SHIPPER)
  @IsNotEmpty({ message: 'Biển số xe là bắt buộc khi đăng ký Shipper' })
  @IsString()
  vehiclePlate?: string;

  @ValidateIf((o) => o.requestedRole === UserRole.SHIPPER)
  @IsNotEmpty({ message: 'Địa chỉ của Shipper là bắt buộc' })
  @IsString()
  shipperAddress?: string;
}