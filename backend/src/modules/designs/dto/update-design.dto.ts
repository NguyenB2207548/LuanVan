import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateDesignDto {
  @IsOptional()
  @IsString({ message: 'Tên thiết kế phải là chuỗi ký tự' })
  designName?: string;

  @IsOptional()
  @IsInt({ message: 'ID sản phẩm phải là số nguyên' })
  @Min(1)
  productId?: number;

  @IsOptional()
  @IsInt({ message: 'ID artwork phải là số nguyên' })
  @Min(1)
  artworkId?: number;
}
