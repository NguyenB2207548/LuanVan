import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddToCartDto } from './dto/add-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  addtoCart(
    @GetUser('userId') id: number,
    @Body() createCartDto: AddToCartDto,
  ) {
    return this.cartsService.addToCart(id, createCartDto);
  }

  @Patch('items/:id')
  @UseGuards(JwtAuthGuard)
  updateQuantity(
    @GetUser('userId') userId: number,
    @Param('id', ParseIntPipe) cartItemId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateQuantity(
      userId,
      cartItemId,
      updateCartItemDto,
    );
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard)
  removeItem(
    @GetUser('userId') userId: number,
    @Param('id', ParseIntPipe) cartItemId: number,
  ) {
    return this.cartsService.removeItem(userId, cartItemId);
  }
}
