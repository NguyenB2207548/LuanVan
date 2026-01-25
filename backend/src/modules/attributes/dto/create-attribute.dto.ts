import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAttributeValueDto } from '../../attribute_values/dto/create-attribute_value.dto';

export class CreateAttributeDto {
  @IsString()
  @IsNotEmpty()
  attributeName: string; // Ví dụ: "Màu sắc", "Kích thước"

  // Dùng để nhận giá trị cụ thể từ Client gửi lên (vd: attributeName: "Màu", value: "Đỏ")
  @ValidateNested()
  @Type(() => CreateAttributeValueDto)
  value: CreateAttributeValueDto;
}
