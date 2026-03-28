import { IsEnum, IsOptional, IsString, IsNotEmpty, ValidateIf } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class CreateApprovalRequestDto {
  @IsEnum(UserRole, { message: 'Vai trò yêu cầu không hợp lệ' })
  @IsNotEmpty({ message: 'Vai trò yêu cầu không được để trống' })
  requestedRole: UserRole;

  // --- CÁC TRƯỜNG ĐỊA CHỈ CẤU TRÚC CHUNG ---
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn Tỉnh/Thành phố' })
  province: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn Quận/Huyện' })
  district: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn Phường/Xã' })
  ward: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ chi tiết' })
  addressDetail: string;

  // --- DỮ LIỆU DÀNH CHO SELLER ---
  @ValidateIf((o) => o.requestedRole === UserRole.SELLER)
  @IsNotEmpty({ message: 'Tên cửa hàng là bắt buộc khi đăng ký Seller' })
  @IsString()
  shopName?: string;

  @IsOptional()
  @IsString()
  shopAddress?: string; // Để Optional vì sẽ gộp chuỗi từ các trường trên

  // --- DỮ LIỆU DÀNH CHO SHIPPER ---
  @ValidateIf((o) => o.requestedRole === UserRole.SHIPPER)
  @IsNotEmpty({ message: 'Biển số xe là bắt buộc khi đăng ký Shipper' })
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  shipperAddress?: string; // Để Optional vì sẽ gộp chuỗi từ các trường trên
}