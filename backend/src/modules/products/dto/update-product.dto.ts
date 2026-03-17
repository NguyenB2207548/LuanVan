// update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import {
  IsArray,
  IsOptional,
  ValidateNested,
  IsInt,
  IsNumber,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVariantDto {
  @IsOptional()
  @IsInt()
  id?: number; // Có ID là update, không có là create mới

  @IsInt()
  stock: number;

  @IsNumber()
  price: number;

  @IsArray()
  @IsInt({ each: true })
  attributeValueIds: number[];

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  variants?: UpdateVariantDto[];
}
