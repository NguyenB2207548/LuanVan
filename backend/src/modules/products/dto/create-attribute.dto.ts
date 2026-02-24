import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateAttributeDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên thuộc tính không được để trống' })
  @MaxLength(100, { message: 'Tên thuộc tính không được vượt quá 100 ký tự' })
  name: string;
}
