import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export class CreateDesignDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên mẫu thiết kế không được để trống' })
  designName: string;

  @IsObject()
  @IsNotEmpty({ message: 'Dữ liệu template JSON không được để trống' })
  templateJson: any;
}
