import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class AttributeValueDto {
  @IsString()
  @IsNotEmpty()
  name: string; // VD: "Màu sắc"

  @IsString()
  @IsNotEmpty()
  value: string; // VD: "Đỏ"
}

// 2. DTO cho từng biến thể (Variant)
class CreateVariantDto {
  @IsNumber()
  @IsNotEmpty()
  price: number; // Thêm trường này để truyền vào bảng Price

  @IsNumber()
  @IsNotEmpty()
  stock: number;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
  attributeValues: AttributeValueDto[];

  @IsArray()
  @IsOptional()
  images?: string[];
}
// 3. DTO chính để tạo Sản phẩm
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @IsArray()
  @IsOptional()
  productImages?: string[];
}
