import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateMockupDto {
  @IsString()
  @IsOptional()
  url: string;

  @IsNumber()
  @IsOptional()
  x?: number;

  @IsNumber()
  @IsOptional()
  y?: number;

  @IsNumber()
  @IsOptional()
  width: number;

  @IsNumber()
  @IsOptional()
  height: number;

  @IsNumber()
  @IsOptional()
  realWidthInch: number;

  @IsNumber()
  @IsOptional()
  realHeightInch: number;
}
