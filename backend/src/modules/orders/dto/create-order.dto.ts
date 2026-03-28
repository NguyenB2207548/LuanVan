import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng cung cấp tên người nhận' })
  recipientName: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng cung cấp số điện thoại' })
  phoneNumber: string;

  @IsString()
  @IsOptional()
  shippingAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn phương thức thanh toán' })
  paymentMethod: string;

  // --- CÁC TRƯỜNG ĐỊA CHỈ CẤU TRÚC MỚI ---
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
  @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường)' })
  addressDetail: string;
}