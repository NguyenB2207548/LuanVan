import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreatePrintAreaDto {
  @IsNotEmpty()
  @IsNumber()
  x: number;

  @IsNotEmpty()
  @IsNumber()
  y: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  width: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  height: number;

  @IsNotEmpty()
  @IsNumber()
  realWidthInch: number;

  @IsNotEmpty()
  @IsNumber()
  realHeightInch: number;

  @IsNumber()
  targetDpi?: number; // Mặc định 300 nếu không gửi
}
