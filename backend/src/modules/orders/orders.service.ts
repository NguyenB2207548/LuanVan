import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
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

  async createOrderFromCart(userId: number, dto: CreateOrderDto) {
    return await this.dataSource.transaction(async (manager) => {
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
        throw new BadRequestException('Giỏ hàng trống!');
      }

      // Nhóm CartItem theo Seller
      const itemsBySeller = new Map<number, CartItem[]>();
      for (const item of cart.items) {
        const sellerId = item.variant.product.seller?.id;
        if (!sellerId)
          throw new BadRequestException(
            `Sản phẩm ${item.variant.product.productName} không rõ người bán`,
          );

        if (!itemsBySeller.has(sellerId)) itemsBySeller.set(sellerId, []);
        itemsBySeller.get(sellerId)!.push(item);
      }

      const createdOrders: Order[] = [];
      let grandTotal = 0; // Tổng tiền của tất cả các đơn để thanh toán MoMo

      //  Tạo Đơn hàng cho từng Seller
      for (const [sellerId, items] of itemsBySeller) {
        let sellerOrderTotal = 0;
        const orderItems: OrderItem[] = [];

        for (const cartItem of items) {
          const variant = cartItem.variant;

          // Check & Update Stock
          if (variant.stock < cartItem.quantity) {
            throw new BadRequestException(
              `Sản phẩm "${variant.product.productName}" hết hàng.`,
            );
          }
          variant.stock -= cartItem.quantity;
          await manager.save(Variant, variant);

          const price = Number(variant.price);
          sellerOrderTotal += price * cartItem.quantity;

          // Lưu OrderItem kèm Snapshot thông tin
          const orderItem = manager.create(OrderItem, {
            variant: { id: variant.id },
            quantity: cartItem.quantity,
            priceAtPurchase: price,
            variantNameSnapshot: `${variant.product.productName} - ${variant.sku}`, // Quan trọng!
            customizedDesignJson: cartItem.customizedDesignJson,
          });
          orderItems.push(orderItem);
        }

        const order = manager.create(Order, {
          orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          totalAmount: sellerOrderTotal,
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
        grandTotal += sellerOrderTotal;
      }

      //  Dọn dẹp giỏ hàng
      await manager.delete(CartItem, { cart: { id: cart.id } });

      let payUrl = null;
      if (dto.paymentMethod === 'MOMO' && createdOrders.length > 0) {
        const orderIds = createdOrders.map((o) => o.id);
        payUrl = await this.momoService.createPaymentUrl({
          amount: grandTotal,
          orderIds: orderIds,
          orderInfo: `Thanh toán ${createdOrders.length} đơn hàng tại MyGiftShop`,
        });
      }

      return {
        message: 'Đặt hàng thành công',
        orders: createdOrders,
        payUrl: payUrl,
      };
    });
  }

  async saveOrder(order: Order) {
    return await this.dataSource.manager.save(Order, order);
  }

  async sellerConfirmOrder(orderId: number, sellerId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, seller: { id: sellerId } },
        relations: ['items'],
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng của bạn');
      }

      //  Kiểm tra trạng thái hiện tại
      if (order.status !== 'pending') {
        throw new BadRequestException(
          `Đơn hàng đã ở trạng thái: ${order.status}`,
        );
      }

      // CHẶN XÁC NHẬN nếu là MOMO nhưng chưa thanh toán thành công
      if (order.paymentMethod === 'MOMO' && order.paymentStatus !== 'paid') {
        throw new BadRequestException(
          'Đơn hàng thanh toán qua MoMo chưa được xác nhận tiền về, không thể xác nhận đơn.',
        );
      }

      //  Cập nhật trạng thái
      order.status = 'confirmed';
      const savedOrder = await manager.save(Order, order);

      // (Tùy chọn) Gửi thông báo/Email cho khách hàng tại đây
      // this.notificationService.send(order.user.id, 'Đơn hàng của bạn đã được xác nhận!');

      return {
        message:
          'Xác nhận đơn hàng thành công, hãy chuẩn bị hàng để giao cho Shipper.',
        data: savedOrder,
      };
    });
  }

  async cancelOrder(orderId: number, userId: number, reason: string) {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, user: { id: userId } },
        relations: ['items', 'items.variant'],
      });

      if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

      if (order.status !== 'pending') {
        throw new BadRequestException(
          'Không thể hủy đơn hàng đã xác nhận hoặc đang giao',
        );
      }

      // 1. Hoàn lại số lượng kho cho từng Variant
      for (const item of order.items) {
        if (item.variant) {
          item.variant.stock += item.quantity;
          await manager.save(Variant, item.variant);
        }
      }

      // 2. Cập nhật trạng thái đơn
      order.status = 'cancelled';

      // 3. Xử lý hoàn tiền nếu đã thanh toán MoMo
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded';
      }

      return await manager.save(Order, order);
    });
  }

  async getAvailableOrdersForShipper() {
    return await this.dataSource.manager.find(Order, {
      where: {
        status: 'confirmed',
        shipper: IsNull(),
      },
      relations: ['seller'],
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        recipientName: true,
        phoneNumber: true,
        shippingAddress: true,
        createdAt: true,
        seller: { fullName: true, phoneNumber: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async shipperPickUpOrder(orderId: number, shipperId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, status: 'confirmed' },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order || order.shipper) {
        throw new BadRequestException(
          'Đơn hàng đã có người khác nhận hoặc không còn khả dụng',
        );
      }

      order.status = 'shipping';
      order.shipper = { id: shipperId } as any;

      return await manager.save(Order, order);
    });
  }

  async shipperCompleteOrder(orderId: number, shipperId: number) {
    const order = await this.dataSource.manager.findOne(Order, {
      where: { id: orderId, shipper: { id: shipperId }, status: 'shipping' },
    });

    if (!order) throw new NotFoundException('Đơn hàng không hợp lệ');

    order.status = 'delivered';

    if (order.paymentMethod === 'COD') {
      order.paymentStatus = 'paid';
    }

    return await this.dataSource.manager.save(Order, order);
  }
  async getOrdersByRole(
    role: string,
    actorId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const query = this.dataSource.manager
      .createQueryBuilder(Order, 'order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      // Chỉ lấy ảnh đại diện của Variant hoặc Product để giảm tải
      .leftJoinAndSelect(
        'variant.images',
        'vImages',
        'vImages.isPrimary = :isPrimary',
        { isPrimary: true },
      )
      .leftJoinAndSelect(
        'product.images',
        'pImages',
        'pImages.isPrimary = :isPrimary',
        { isPrimary: true },
      );

    // 1. Phân quyền truy vấn
    switch (role) {
      case 'user':
        query
          .where('order.user_id = :actorId', { actorId })
          .leftJoinAndSelect('order.seller', 'seller');
        break;
      case 'seller':
        query
          .where('order.seller_id = :actorId', { actorId })
          .leftJoinAndSelect('order.user', 'customer');
        break;
      case 'shipper':
        query
          .where('order.shipper_id = :actorId', { actorId })
          .leftJoinAndSelect('order.seller', 'seller');
        break;
      default:
        throw new BadRequestException('Role không hợp lệ');
    }

    // 2. Phân trang & Sắp xếp
    query
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
  async getOrderById(orderId: number, actor?: { id: number; role: string }) {
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

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}`);
    }

    if (actor) {
      const isOwner =
        (actor.role === 'user' && order.user.id === actor.id) ||
        (actor.role === 'seller' && order.seller.id === actor.id) ||
        (actor.role === 'shipper' && order.shipper?.id === actor.id) ||
        actor.role === 'admin';

      if (!isOwner) {
        throw new ForbiddenException(
          'Bạn không có quyền xem chi tiết đơn hàng này',
        );
      }
    }

    return order;
  }
}
