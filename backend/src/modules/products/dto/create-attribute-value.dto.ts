import { IsString, IsNotEmpty, IsInt, MaxLength } from 'class-validator';

export class CreateAttributeValueDto {
  @IsString({ message: 'Giá trị thuộc tính phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên giá trị không được để trống' })
  @MaxLength(100, { message: 'Giá trị không được vượt quá 100 ký tự' })
  valueName: string;

  @IsInt({ message: 'ID của thuộc tính cha phải là số nguyên' })
  @IsNotEmpty({ message: 'Thiếu ID của thuộc tính' })
  attributeId: number;
}
