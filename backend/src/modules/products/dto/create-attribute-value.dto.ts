import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateAttributeValueDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên giá trị không được để trống' })
  valueName: string;

  @IsNumber({}, { message: 'ID của thuộc tính cha phải là số' })
  @IsNotEmpty({ message: 'Thiếu ID của thuộc tính' })
  attributeId: number;
}
