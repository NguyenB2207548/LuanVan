import { IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAttributeDto } from '../../attributes/dto/create-attribute.dto';

export class CreateVariantDto {
  @IsInt()
  @Min(0)
  stock: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeDto)
  attributes: CreateAttributeDto[];
}
