import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddToCartDto } from './dto/add-cart.dto';
import { DataSource } from 'typeorm';
import { Variant } from '../products/entities/variant.entity';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartsService {
  constructor(private readonly dataSource: DataSource) {}

  // 1. Lấy giỏ hàng: Tận dụng quan hệ mới để lấy ảnh và giá cực nhanh
  async getCart(userId: number) {
    const cart = await this.dataSource.manager.findOne(Cart, {
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.images', // Lấy ảnh Variant trực tiếp từ FK
        'items.variant.product.images', // Lấy ảnh Product trực tiếp từ FK
        'items.variant.attributeValues',
        'items.variant.attributeValues.attribute',
      ],
      order: { items: { id: 'DESC' } },
    });

    if (!cart) {
      return { items: [] };
    }

    return cart;
  }

  async countCartItems(userId: number) {
    // Tìm giỏ hàng của user trước
    const cart = await this.dataSource.manager.findOne(Cart, {
      where: { user: { id: userId } },
    });

    if (!cart) {
      return { count: 0 };
    }

    // Tính tổng quantity của tất cả items trong giỏ hàng đó
    const result = await this.dataSource.manager
      .createQueryBuilder(CartItem, 'item')
      .select('SUM(item.quantity)', 'sum')
      .where('item.cart_id = :cartId', { cartId: cart.id })
      .getRawOne();

    return {
      count: parseInt(result.sum) || 0,
    };
  }

  async addToCart(userId: number, dto: AddToCartDto) {
    const { variantId, quantity, customizedDesignJson, previewDesign } = dto;

    return await this.dataSource.transaction(async (manager) => {
      const variant = await manager.findOne(Variant, {
        where: { id: variantId },
      });
      if (!variant) throw new NotFoundException('Sản phẩm không tồn tại');
      if (variant.stock < quantity) {
        throw new BadRequestException(
          `Kho không đủ hàng (Còn lại: ${variant.stock})`,
        );
      }

      let cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
      });
      if (!cart) {
        cart = await manager.save(
          Cart,
          manager.create(Cart, { user: { id: userId } }),
        );
      }

      const existingItems = await manager.find(CartItem, {
        where: { cart: { id: cart.id }, variant: { id: variantId } },
      });

      let cartItem: CartItem | null = null;

      if (!customizedDesignJson) {
        cartItem =
          existingItems.find((item) => !item.customizedDesignJson) || null;
      } else {
        cartItem =
          existingItems.find((item) => {
            if (!item.customizedDesignJson) return false;
            return (
              JSON.stringify(item.customizedDesignJson) ===
              JSON.stringify(customizedDesignJson)
            );
          }) || null;
      }

      if (cartItem) {
        if (variant.stock < cartItem.quantity + quantity) {
          throw new BadRequestException('Tổng số lượng vượt quá tồn kho');
        }
        cartItem.quantity += quantity;

        if (previewDesign) {
          cartItem.previewDesign = previewDesign;
        }
      } else {
        cartItem = manager.create(CartItem, {
          cart,
          variant,
          quantity,
          customizedDesignJson,
          previewDesign,
        });
      }

      await manager.save(CartItem, cartItem);
      return this.getCart(userId);
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

      return this.getCart(userId);
    });
  }

  // 4. Xóa item
  async removeItem(userId: number, cartItemId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const cartItem = await manager.findOne(CartItem, {
        where: { id: cartItemId, cart: { user: { id: userId } } },
      });

      if (!cartItem) {
        throw new NotFoundException('Không tồn tại sản phẩm trong giỏ hàng');
      }

      await manager.remove(CartItem, cartItem);

      return this.getCart(userId);
    });
  }
}
