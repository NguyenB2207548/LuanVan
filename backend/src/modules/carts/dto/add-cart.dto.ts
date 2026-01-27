import { IsInt, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  variantId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  customizedDesignJson?: any;
}
