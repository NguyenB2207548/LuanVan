import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddToCartDto } from './dto/add-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { DataSource, Not } from 'typeorm';
import { Variant } from '../products/entities/variant.entity';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import {
  Image as ImageEntity,
  ImageOwnerType,
} from '../images/entities/image.entity';

@Injectable()
export class CartsService {
  constructor(private readonly dataSource: DataSource) {}

  async getCart(userId: number) {
    const cart = await this.dataSource.manager.findOne(Cart, {
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.prices',
      ],
      order: { items: { id: 'DESC' } },
    });

    if (!cart) {
      return { items: [] };
    }

    for (const item of cart.items) {
      if (item.variant) {
        item.variant['images'] = await this.dataSource.manager.find(
          ImageEntity,
          {
            where: {
              ownerId: item.variant.id,
              ownerType: ImageOwnerType.VARIANT,
            },
          },
        );

        if (item.variant.product) {
          item.variant.product['images'] = await this.dataSource.manager.find(
            ImageEntity,
            {
              where: {
                ownerId: item.variant.product.id,
                ownerType: ImageOwnerType.PRODUCT,
              },
            },
          );
        }
      }
    }

    return cart;
  }

  async addToCart(userId: number, dto: AddToCartDto) {
    const { variantId, quantity, customizedDesignJson } = dto;

    return await this.dataSource.transaction(async (manager) => {
      const variant = await manager.findOne(Variant, {
        where: { id: variantId },
      });

      if (!variant) {
        throw new NotFoundException('Sản phẩm không tồn tại');
      }

      if (variant.stock < quantity) {
        throw new BadRequestException(
          `Số lượng sản phẩm trong kho không đủ, còn lại: ${variant.stock}`,
        );
      }

      let cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
      });

      if (!cart) {
        const newCart = manager.create(Cart, { user: { id: userId } });
        cart = await manager.save(Cart, newCart);
      }

      if (!cart) throw new Error('Giỏ hàng không tồn tại');

      const newItem = manager.create(CartItem, {
        cart: { id: cart.id },
        variant: { id: variantId },
        quantity,
        customizedDesignJson,
      });

      await manager.save(CartItem, newItem);

      return await manager.findOne(Cart, {
        where: { id: cart.id },
        relations: [
          'items',
          'items.variant',
          'items.variant.product',
          'items.variant.prices',
        ],
        order: { items: { id: 'DESC' } },
      });
    });
  }

  async updateQuantity(
    userId: number,
    cartItemId: number,
    dto: UpdateCartItemDto,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const cartItem = await manager.findOne(CartItem, {
        where: {
          id: cartItemId,
          cart: { user: { id: userId } },
        },
        relations: ['variant', 'cart'],
      });

      if (!cartItem) {
        throw new NotFoundException('Không tồn tại sản phẩm trong giỏ hàng');
      }

      if (cartItem.variant.stock < dto.quantity) {
        throw new BadRequestException(
          `Số lượng sản phẩm trong kho không đủ, còn lại: ${cartItem.variant.stock}`,
        );
      }

      cartItem.quantity = dto.quantity;
      await manager.save(CartItem, cartItem);

      return await manager.findOne(Cart, {
        where: { id: cartItem.cart.id },
        relations: [
          'items',
          'items.variant',
          'items.variant.product',
          'items.variant.prices',
        ],
        order: { items: { id: 'DESC' } },
      });
    });
  }

  async removeItem(userId: number, cartItemId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const cartItem = await manager.findOne(CartItem, {
        where: { id: cartItemId, cart: { user: { id: userId } } },
      });
      if (!cartItem) {
        throw new NotFoundException('Không tồn tại sản phẩm trong giỏ hàng');
      }
      await manager.remove(CartItem, cartItem);

      return await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: [
          'items',
          'items.variant',
          'items.variant.product',
          'items.variant.prices',
        ],
        order: { items: { id: 'DESC' } },
      });
    });
  }
}
