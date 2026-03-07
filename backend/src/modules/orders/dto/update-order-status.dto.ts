import { IsEnum, IsNotEmpty } from 'class-validator';

// Định nghĩa các trạng thái cho phép (Bỏ qua 'shipped')
export enum AllowedOrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: 'Vui lòng cung cấp trạng thái mới' })
  @IsEnum(AllowedOrderStatus, {
    message:
      'Trạng thái không hợp lệ. Chỉ chấp nhận: pending, processing, delivered, cancelled',
  })
  status: AllowedOrderStatus;
}
