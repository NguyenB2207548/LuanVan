import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng cung cấp tên người nhận' })
  recipientName: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng cung cấp số điện thoại' })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng cung cấp địa chỉ giao hàng' })
  shippingAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn phương thức thanh toán' })
  paymentMethod: string; // 'COD' hoặc 'VNPAY'
}
