import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../carts/entities/cart.entity';
import { Variant } from '../products/entities/variant.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CartItem } from '../carts/entities/cart-item.entity';
import { MomoService } from './momo.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrdersService {
  constructor(
    // 1. Phải có DataSource ở đây để dùng transaction
    private readonly dataSource: DataSource,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    // 2. Inject MomoService
    private readonly momoService: MomoService,
  ) { }

  async getOrderItemWithDesign(orderItemId: number) {
    const orderItem = await this.dataSource.getRepository(OrderItem).findOne({
      where: { id: orderItemId },
      relations: ['variant', 'variant.mockup', 'variant.mockup.printArea'],
    });

    if (!orderItem) {
      throw new NotFoundException('Không tìm thấy chi tiết đơn hàng');
    }

    return orderItem; // QUAN TRỌNG: Phải có dòng return này
  }

  async getOrderDetails(orderId: number, user: { id: number; role: string }) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'user',
        'seller',
        'items',
        'items.variant',
        'items.variant.images', // Lấy ảnh trực tiếp của biến thể
        'items.variant.product',
        'items.variant.product.images', // Lấy ảnh của sản phẩm gốc (dùng làm fallback)
      ],
    });

    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    // Kiểm tra quyền truy cập đơn giản hơn
    const isOwner = order.user.id === user.id;
    const isSeller = order.seller.id === user.id;
    const isAdmin = user.role === 'admin';
    const isShipper = user.role === 'shipper' && order.shipper?.id === user.id; // Nếu có shipper

    if (!isAdmin && !isOwner && !isSeller && !isShipper) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }

    return order;
  }

  // async getOrderDetails(orderId: number, user: { id: number; role: string }) {
  //   const order = await this.orderRepository.findOne({
  //     where: { id: orderId },
  //     relations: [
  //       'user',
  //       'seller',
  //       'items',
  //       'items.variant',
  //       'items.variant.product',
  //     ],
  //   });

  //   if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

  //   // Kiểm tra quyền truy cập (như đã thảo luận ở các bước trước)
  //   const canAccess =
  //     user.role === 'admin' ||
  //     order.user.id === user.id ||
  //     order.seller.id === user.id;

  //   if (!canAccess)
  //     throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');

  //   return order;
  // }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return await this.orderRepository.findOne({
      where: { orderNumber: orderNumber }, // Đảm bảo field name đúng với entity của bạn
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
      // 1. Tìm đơn hàng kèm theo quan hệ seller để kiểm tra quyền sở hữu
      const order = await manager.findOne(Order, {
        where: {
          id: orderId,
          seller: { id: sellerId }, // Đảm bảo Entity Order có @ManyToOne tới Seller
        },
        relations: ['items', 'user'], // Load thêm user nếu muốn gửi email sau này
      });

      if (!order) {
        throw new NotFoundException(
          'Không tìm thấy đơn hàng hoặc bạn không có quyền xử lý đơn này.',
        );
      }

      // 2. Chặn nếu đơn hàng không ở trạng thái chờ (pending)
      if (order.status !== 'pending') {
        throw new BadRequestException(
          `Không thể xác nhận vì đơn hàng đang ở trạng thái: ${order.status}`,
        );
      }

      // 3. Logic chặn xác nhận nếu chưa thanh toán (MOMO / VNPAY / Chuyển khoản)
      const onlinePaymentMethods = ['MOMO', 'VNPAY', 'BANK_TRANSFER'];
      if (
        onlinePaymentMethods.includes(order.paymentMethod) &&
        order.paymentStatus !== 'paid'
      ) {
        throw new BadRequestException(
          'Đơn hàng thanh toán online chưa được xác nhận thanh toán thành công.',
        );
      }

      // 4. Cập nhật trạng thái
      order.status = 'confirmed';
      // Cập nhật ngày xác nhận nếu bạn có trường này (ví dụ: confirmedAt)
      // order.confirmedAt = new Date();

      const savedOrder = await manager.save(Order, order);

      return {
        message: 'Xác nhận đơn hàng thành công!',
        data: savedOrder,
      };
    });
  }


  async shipperFailOrder(orderId: number, shipperId: number, reason: string) {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: {
          id: orderId,
          shipper: { id: shipperId },
          status: 'shipping',
        },
        relations: ['items', 'items.variant'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng đang giao của bạn');
      }

      for (const item of order.items) {
        if (item.variant) {

          item.variant.stock = Number(item.variant.stock) + item.quantity;
          await manager.save(Variant, item.variant);
        }
      }

      order.status = 'failed';

      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded';
      }

      const savedOrder = await manager.save(Order, order);

      return {
        message: 'Đã xác nhận giao hàng thất bại và hoàn kho thành công.',
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
        seller: {
          id: true,
          fullName: true,
          phoneNumber: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  // async getAvailableOrdersForShipper() {
  //   const rawOrders = await this.dataSource.manager
  //     .createQueryBuilder(Order, 'order')
  //     .where('order.status = :status', { status: 'confirmed' })
  //     .getRawMany();


  //   const results = await this.dataSource.manager.find(Order, {
  //     where: {
  //       status: 'confirmed',
  //       shipper: IsNull(),
  //     },
  //     relations: ['seller'],
  //   });

  //   return results;
  // }

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

    order.status = 'success';

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
      .leftJoinAndSelect('variant.images', 'vImages', 'vImages.isPrimary = :isPrimary', { isPrimary: true })
      .leftJoinAndSelect('product.images', 'pImages', 'pImages.isPrimary = :isPrimary', { isPrimary: true });

    switch (role) {
      case 'user':
        query
          .where('order.user_id = :actorId', { actorId })
          .leftJoinAndSelect('order.seller', 'seller')
          .orderBy('order.createdAt', 'DESC');
        break;

      case 'seller':
        query
          .where('order.seller_id = :actorId', { actorId })
          .leftJoinAndSelect('order.user', 'customer')
          .orderBy('order.createdAt', 'DESC');
        break;

      case 'shipper':
        query
          .where('order.shipper_id = :actorId', { actorId })
          .leftJoinAndSelect('order.seller', 'seller')
          // 1. Tạo một cột ảo để tính độ ưu tiên
          .addSelect(
            `(CASE 
                WHEN order.status = 'shipping' THEN 1 
                WHEN order.status = 'success' THEN 2 
                ELSE 3 
              END)`,
            'order_priority', // Alias cho cột ảo
          )
          // 2. Sắp xếp theo alias của cột ảo vừa tạo
          // Lưu ý: NULLS LAST để đảm bảo nếu có lỗi vẫn đẩy xuống dưới
          .orderBy('order_priority', 'ASC')
          .addOrderBy('order.createdAt', 'DESC');
        break;

      default:
        throw new BadRequestException('Role không hợp lệ');
    }

    // Phân trang
    query
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
}
