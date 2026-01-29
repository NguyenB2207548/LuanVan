// get-active-design.dto.ts
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class GetActiveDesignDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  productId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  variantId?: number;
}
