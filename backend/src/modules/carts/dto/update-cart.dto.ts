import { PartialType } from '@nestjs/mapped-types';
import { AddToCartDto } from './add-cart.dto';

export class UpdateCartDto extends PartialType(AddToCartDto) {}
