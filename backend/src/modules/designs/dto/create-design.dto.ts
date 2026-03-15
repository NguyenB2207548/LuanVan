import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class ArtworkDto {
  @IsNotEmpty()
  @IsString()
  layersJson: string;

  @IsOptional()
  @IsNumber()
  order: number;
}

export class CreateDesignDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtworkDto)
  artworks: ArtworkDto[];
}

export class UpdateMockupDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsNumber()
  x: number;

  @IsNotEmpty()
  @IsNumber()
  y: number;

  @IsNotEmpty()
  @IsNumber()
  width: number;

  @IsNotEmpty()
  @IsNumber()
  height: number;

  @IsNumber()
  realWidthInch: number;

  @IsNumber()
  realHeightInch: number;
}
