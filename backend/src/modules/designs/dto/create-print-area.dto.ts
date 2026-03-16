import { Optional } from '@nestjs/common/decorators/core/optional.decorator';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreatePrintAreaDto {
  @Optional()
  @IsNotEmpty()
  @IsNumber()
  x: number;

  @Optional()
  @IsNotEmpty()
  @IsNumber()
  y: number;

  @Optional()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  width: number;

  @Optional()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  height: number;

  @Optional()
  @IsNotEmpty()
  @IsNumber()
  realWidthInch: number;

  @Optional()
  @IsNotEmpty()
  @IsNumber()
  realHeightInch: number;

  @Optional()
  @IsNumber()
  targetDpi?: number; // Mặc định 300 nếu không gửi
}
