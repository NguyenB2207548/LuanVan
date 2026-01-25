import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAttributeValueDto {
  @IsString()
  @IsNotEmpty()
  valueName: string; // Ví dụ: "Đỏ", "XL", "Cotton"
}
