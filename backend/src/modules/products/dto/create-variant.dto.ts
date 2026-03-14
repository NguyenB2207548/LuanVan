import {
  IsNumber,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class CreateVariantDto {
  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên' })
  @Min(0, { message: 'Tồn kho không được nhỏ hơn 0' })
  stock: number;

  @IsNumber({}, { message: 'Giá sản phẩm phải là số' })
  @Min(0, { message: 'Giá sản phẩm không được nhỏ hơn 0' })
  @IsNotEmpty({ message: 'Giá biến thể không được để trống' })
  price: number;

  @IsArray({ message: 'Danh sách giá trị thuộc tính phải là một mảng' })
  @IsInt({ each: true, message: 'ID giá trị thuộc tính phải là số nguyên' })
  @IsNotEmpty({ message: 'Biến thể phải có ít nhất một giá trị thuộc tính' })
  attributeValueIds: number[];

  @IsString({ message: 'Mã SKU phải là chuỗi ký tự' })
  @IsOptional()
  sku?: string;

  @IsArray({ message: 'Danh sách hình ảnh phải là mảng chuỗi URL' })
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
