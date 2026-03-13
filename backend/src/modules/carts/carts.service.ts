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

  // 2. Thêm vào giỏ hàng: Xử lý logic cá nhân hóa thiết kế AI
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

      // Tìm hoặc tạo giỏ hàng cho User
      let cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
      });

      if (!cart) {
        cart = await manager.save(
          Cart,
          manager.create(Cart, { user: { id: userId } }),
        );
      }

      // KIỂM TRA: Nếu cùng variant và CÙNG thiết kế thiết kế cũ thì tăng số lượng
      // (Trong quà tặng cá nhân hóa, nếu thiết kế khác nhau thì nên là 2 item khác nhau)
      let cartItem = await manager.findOne(CartItem, {
        where: {
          cart: { id: cart.id },
          variant: { id: variantId },
          // Chỉ gộp nếu thiết kế giống hệt (hoặc không có thiết kế)
          customizedDesignJson: customizedDesignJson || null,
        },
      });

      if (cartItem) {
        cartItem.quantity += quantity;
      } else {
        cartItem = manager.create(CartItem, {
          cart: { id: cart.id },
          variant: { id: variantId },
          quantity,
          customizedDesignJson,
        });
      }

      await manager.save(CartItem, cartItem);

      // Trả về giỏ hàng mới nhất
      return this.getCart(userId);
    });
  }

  // 3. Cập nhật số lượng
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
