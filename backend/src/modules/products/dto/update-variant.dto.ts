import { IsInt, IsOptional } from 'class-validator';
import { CreateVariantDto } from './create-variant.dto';

export class UpdateVariantDto extends CreateVariantDto {
  @IsOptional()
  @IsInt()
  id?: number;
}
