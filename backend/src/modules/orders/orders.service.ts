import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../carts/entities/cart.entity';
import { Variant } from '../products/entities/variant.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CartItem } from '../carts/entities/cart-item.entity';
import { MomoService } from './momo.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private momoService: MomoService,
  ) {}

  async findByOrderNumber(orderNumber: string) {
    return await this.dataSource.manager.findOne(Order, {
      where: { orderNumber },
      relations: ['user', 'seller'],
    });
  }

  // 1. CHECKOUT: Tách đơn theo Seller & Xóa giỏ hàng
  async createOrderFromCart(userId: number, dto: CreateOrderDto) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Lấy Giỏ hàng (Giữ nguyên logic của bạn)
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: [
          'items',
          'items.variant',
          'items.variant.product',
          'items.variant.product.seller',
        ],
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Giỏ hàng trống, không thể đặt hàng!');
      }

      // 2. Nhóm CartItem theo Seller ID (Giữ nguyên logic của bạn)
      const itemsBySeller = new Map<number, any[]>();
      for (const item of cart.items) {
        const sellerId = item.variant.product.seller?.id;
        if (!sellerId)
          throw new BadRequestException(
            `Sản phẩm ${item.variant.product.productName} không có người bán hợp lệ`,
          );

        if (!itemsBySeller.has(sellerId)) {
          itemsBySeller.set(sellerId, []);
        }
        itemsBySeller.get(sellerId)!.push(item);
      }

      const createdOrders: Order[] = [];

      // 3. Duyệt qua từng nhóm Seller để tạo Đơn hàng (Giữ nguyên logic của bạn)
      for (const [sellerId, items] of itemsBySeller) {
        let totalAmount = 0;
        const orderItems: OrderItem[] = [];

        for (const cartItem of items) {
          const variant = cartItem.variant;

          if (variant.stock < cartItem.quantity) {
            throw new BadRequestException(
              `Sản phẩm "${variant.product.productName}" không đủ hàng.`,
            );
          }

          variant.stock -= cartItem.quantity;
          await manager.save(Variant, variant);

          const price = Number(variant.price);
          totalAmount += price * cartItem.quantity;

          const orderItem = manager.create(OrderItem, {
            variant: { id: variant.id },
            quantity: cartItem.quantity,
            priceAtPurchase: price,
            customizedDesignJson: cartItem.customizedDesignJson,
          });
          orderItems.push(orderItem);
        }

        const order = manager.create(Order, {
          orderNumber: `ORD-${Date.now()}-${sellerId}-${userId}`,
          totalAmount,
          recipientName: dto.recipientName,
          phoneNumber: dto.phoneNumber,
          shippingAddress: dto.shippingAddress,
          paymentMethod: dto.paymentMethod,
          status: 'pending',
          user: { id: userId },
          seller: { id: sellerId },
          items: orderItems,
        });

        const savedOrder = await manager.save(Order, order);
        createdOrders.push(savedOrder);
      }

      // 4. Xóa sạch giỏ hàng (Sử dụng CartItem entity để an toàn hơn string)
      await manager.delete(CartItem, { cart: { id: cart.id } });

      // 5. TÍCH HỢP THANH TOÁN MOMO
      let payUrl = null;

      // Nếu chọn MOMO và có đơn hàng được tạo
      if (dto.paymentMethod === 'MOMO' && createdOrders.length > 0) {
        // Để đơn giản cho demo: Thanh toán cho đơn hàng đầu tiên trong danh sách tách đơn
        // Hoặc bạn có thể logic gộp tiền nhưng MoMo cần 1 OrderId duy nhất.
        payUrl = await this.momoService.createPaymentUrl(createdOrders[0]);
      }

      // Trả về cả danh sách đơn và link thanh toán (nếu có)
      return {
        orders: createdOrders,
        payUrl: payUrl,
      };
    });
  }

  async saveOrder(order: Order) {
    return await this.dataSource.manager.save(Order, order);
  }

  // 2. SELLER: Xác nhận đơn hàng (Chuyển từ pending -> confirmed)
  async sellerConfirmOrder(orderId: number, sellerId: number) {
    const order = await this.dataSource.manager.findOne(Order, {
      where: { id: orderId, seller: { id: sellerId }, status: 'pending' },
    });

    if (!order)
      throw new NotFoundException(
        'Không tìm thấy đơn hàng chờ xác nhận của bạn',
      );

    order.status = 'confirmed';
    return await this.dataSource.manager.save(Order, order);
  }

  // 3. SHIPPER: Lấy danh sách đơn hàng chờ nhận (confirmed)
  async getAvailableOrdersForShipper() {
    return await this.dataSource.manager.find(Order, {
      where: { status: 'confirmed' },
      relations: ['items', 'items.variant', 'items.variant.product', 'seller'],
      order: { createdAt: 'DESC' },
    });
  }

  // 4. SHIPPER: Nhận đơn hàng (Chuyển từ confirmed -> shipping)
  async shipperPickUpOrder(orderId: number, shipperId: number) {
    const order = await this.dataSource.manager.findOne(Order, {
      where: { id: orderId, status: 'confirmed' },
    });

    if (!order)
      throw new NotFoundException(
        'Đơn hàng không còn khả dụng hoặc đã có người nhận',
      );

    order.status = 'shipping';
    order.shipper = { id: shipperId } as any; // Gán quan hệ Object Shipper
    return await this.dataSource.manager.save(Order, order);
  }

  // 5. SHIPPER: Hoàn thành giao hàng (Chuyển từ shipping -> delivered)
  async shipperCompleteOrder(orderId: number, shipperId: number) {
    const order = await this.dataSource.manager.findOne(Order, {
      where: { id: orderId, shipper: { id: shipperId }, status: 'shipping' },
    });

    if (!order)
      throw new NotFoundException(
        'Đơn hàng không thuộc quyền vận chuyển của bạn',
      );

    order.status = 'delivered';
    order.paymentStatus = 'paid';
    return await this.dataSource.manager.save(Order, order);
  }

  // 6. LẤY DANH SÁCH ĐƠN HÀNG THEO VAI TRÒ (Dành cho Lịch sử đơn hàng)
  async getOrdersByRole(role: string, actorId: number) {
    const where: any = {};
    if (role === 'user') where.user = { id: actorId };
    if (role === 'seller') where.seller = { id: actorId };
    if (role === 'shipper') where.shipper = { id: actorId };

    return await this.dataSource.manager.find(Order, {
      where,
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.images', // Ảnh lấy trực tiếp qua relation
        'items.variant.product.images',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // 7. CHI TIẾT ĐƠN HÀNG
  async getOrderById(orderId: number) {
    const order = await this.dataSource.manager.findOne(Order, {
      where: { id: orderId },
      relations: [
        'user',
        'seller',
        'shipper',
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.images',
      ],
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }
}
