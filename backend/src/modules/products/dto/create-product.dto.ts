import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class AttributeValueDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên thuộc tính không được để trống' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Giá trị thuộc tính không được để trống' })
  value: string;
}

class CreateVariantDto {
  @IsNumber()
  @IsPositive({ message: 'Giá sản phẩm phải là số dương' })
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @Min(0, { message: 'Số lượng tồn kho không được âm' })
  @IsNotEmpty()
  stock: number;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
  attributeValues: AttributeValueDto[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
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
  @IsString({ each: true })
  productImages?: string[];
}
