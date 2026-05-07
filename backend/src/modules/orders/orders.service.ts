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
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly momoService: MomoService,
    private readonly notificationsService: NotificationsService,
  ) {}

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

      const fullAddress = `${dto.addressDetail}, ${dto.ward}, ${dto.district}, ${dto.province}`;
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
      let grandTotal = 0;

      for (const [sellerId, items] of itemsBySeller) {
        let sellerOrderTotal = 0;
        const orderItems: OrderItem[] = [];

        for (const cartItem of items) {
          const variant = cartItem.variant;

          if (variant.stock < cartItem.quantity) {
            throw new BadRequestException(
              `Sản phẩm "${variant.product.productName}" hết hàng.`,
            );
          }
          variant.stock -= cartItem.quantity;
          await manager.save(Variant, variant);

          const price = Number(variant.price);
          sellerOrderTotal += price * cartItem.quantity;

          const orderItem = manager.create(OrderItem, {
            variant: { id: variant.id },
            quantity: cartItem.quantity,
            priceAtPurchase: price,
            variantNameSnapshot: `${variant.product.productName} - ${variant.sku}`,
            customizedDesignJson: cartItem.customizedDesignJson,
            previewDesign: cartItem.previewDesign,
          });
          orderItems.push(orderItem);
        }

        const order = manager.create(Order, {
          orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          totalAmount: sellerOrderTotal,
          recipientName: dto.recipientName,
          phoneNumber: dto.phoneNumber,
          shippingAddress: fullAddress,
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

      await manager.delete(CartItem, { cart: { id: cart.id } });

      await Promise.all(
        createdOrders.map((order) =>
          this.notificationsService.createWithManager(manager, {
            recipientId: order.seller.id,
            type: NotificationType.ORDER_PLACED,
            title: 'Đơn hàng mới',
            body: `Bạn có đơn hàng mới ${order.orderNumber} đang chờ xác nhận.`,
            orderId: order.id,
          }),
        ),
      );

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

      await this.notificationsService.createWithManager(manager, {
        recipientId: order.user.id,
        type: NotificationType.ORDER_CONFIRMED,
        title: 'Đơn hàng được xác nhận',
        body: `Đơn hàng ${order.orderNumber} đã được người bán xác nhận và đang chuẩn bị hàng.`,
        orderId: order.id,
      });

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
        relations: ['items', 'items.variant', 'seller', 'user'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException(
          'Không tìm thấy đơn hàng đang giao của bạn',
        );
      }

      order.status = 'confirmed';

      order.shipper = null;

      const savedOrder = await manager.save(Order, order);

      await Promise.all([
        this.notificationsService.createWithManager(manager, {
          recipientId: order.seller.id,
          type: NotificationType.ORDER_FAILED,
          title: 'Giao hàng không thành công',
          body: `Đơn ${order.orderNumber} giao thất bại vì: ${reason}. Đơn đã được đẩy lại vào danh sách chờ Shipper khác.`,
          orderId: order.id,
        }),
        this.notificationsService.createWithManager(manager, {
          recipientId: order.user.id,
          type: NotificationType.ORDER_FAILED,
          title: 'Giao hàng tạm hoãn',
          body: `Shipper không thể giao đơn ${order.orderNumber} đến bạn (Lý do: ${reason}). Chúng tôi sẽ sắp xếp giao lại sớm nhất.`,
          orderId: order.id,
        }),
      ]);

      return {
        message:
          'Đã báo cáo giao thất bại. Đơn hàng được trả về trạng thái chờ Shipper khác.',
        data: savedOrder,
      };
    });
  }

  // async shipperFailOrder(orderId: number, shipperId: number, reason: string) {
  //   return await this.dataSource.transaction(async (manager) => {
  //     const order = await manager.findOne(Order, {
  //       where: {
  //         id: orderId,
  //         shipper: { id: shipperId },
  //         status: 'shipping',
  //       },
  //       relations: ['items', 'items.variant', 'seller', 'user'],
  //       lock: { mode: 'pessimistic_write' },
  //     });

  //     if (!order) {
  //       throw new NotFoundException(
  //         'Không tìm thấy đơn hàng đang giao của bạn',
  //       );
  //     }

  //     for (const item of order.items) {
  //       if (item.variant) {
  //         item.variant.stock = Number(item.variant.stock) + item.quantity;
  //         await manager.save(Variant, item.variant);
  //       }
  //     }

  //     order.status = 'failed';

  //     if (order.paymentStatus === 'paid') {
  //       order.paymentStatus = 'refunded';
  //     }

  //     const savedOrder = await manager.save(Order, order);

  //     await Promise.all([
  //       this.notificationsService.createWithManager(manager, {
  //         recipientId: order.seller.id,
  //         type: NotificationType.ORDER_FAILED,
  //         title: 'Giao hàng thất bại',
  //         body: `Đơn hàng ${order.orderNumber} giao thất bại. Vui lòng liên hệ shipper để xử lý.`,
  //         orderId: order.id,
  //       }),
  //       this.notificationsService.createWithManager(manager, {
  //         recipientId: order.user.id,
  //         type: NotificationType.ORDER_FAILED,
  //         title: 'Giao hàng thất bại',
  //         body: `Đơn hàng ${order.orderNumber} không thể giao đến bạn. Chúng tôi sẽ liên hệ sớm.`,
  //         orderId: order.id,
  //       }),
  //     ]);

  //     return {
  //       message: 'Đã xác nhận giao hàng thất bại và hoàn kho thành công.',
  //       data: savedOrder,
  //     };
  //   });
  // }

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
  async shipperPickUpOrder(orderId: number, shipperId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, status: 'confirmed' },
        relations: ['seller'], // ← thêm
        lock: { mode: 'pessimistic_write' },
      });

      if (!order || order.shipper) {
        throw new BadRequestException(
          'Đơn hàng đã có người khác nhận hoặc không còn khả dụng',
        );
      }

      order.status = 'shipping';
      order.shipper = { id: shipperId } as any;

      const savedOrder = await manager.save(Order, order);

      await this.notificationsService.createWithManager(manager, {
        recipientId: order.seller.id,
        type: NotificationType.SHIPPER_PICKED_UP,
        title: 'Shipper đã nhận hàng',
        body: `Shipper đã nhận đơn hàng ${order.orderNumber} và đang trên đường giao.`,
        orderId: order.id,
      });

      return savedOrder;
    });
  }

  async shipperCompleteOrder(orderId: number, shipperId: number) {
    // Đổi sang transaction để dùng chung manager với notification
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, shipper: { id: shipperId }, status: 'shipping' },
        relations: ['seller', 'user'], // ← thêm
      });

      if (!order) throw new NotFoundException('Đơn hàng không hợp lệ');

      order.status = 'success';
      if (order.paymentMethod === 'COD') {
        order.paymentStatus = 'paid';
      }

      const savedOrder = await manager.save(Order, order);

      await Promise.all([
        this.notificationsService.createWithManager(manager, {
          recipientId: order.seller.id,
          type: NotificationType.ORDER_DELIVERED,
          title: 'Giao hàng thành công',
          body: `Đơn hàng ${order.orderNumber} đã được giao thành công đến khách hàng.`,
          orderId: order.id,
        }),
        this.notificationsService.createWithManager(manager, {
          recipientId: order.user.id,
          type: NotificationType.ORDER_DELIVERED,
          title: 'Đơn hàng đã được giao',
          body: `Đơn hàng ${order.orderNumber} đã được giao thành công. Cảm ơn bạn đã mua hàng!`,
          orderId: order.id,
        }),
      ]);

      return savedOrder;
    });
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

    switch (role) {
      case 'user':
        query
          .where('order.user_id = :actorId', { actorId })
          .leftJoin('order.seller', 'seller')
          .addSelect([
            'seller.id',
            'seller.fullName',
            'seller.phoneNumber',
            'seller.email',
          ])
          .leftJoinAndSelect('seller.sellerProfile', 'sellerProfile')
          .leftJoin('order.shipper', 'shipper')
          .addSelect(['shipper.id', 'shipper.fullName', 'shipper.phoneNumber'])
          .leftJoinAndSelect('shipper.shipperProfile', 'shipperProfile')
          .orderBy('order.createdAt', 'DESC');
        break;

      case 'seller':
        query
          .where('order.seller_id = :actorId', { actorId })
          .leftJoinAndSelect('order.user', 'customer')
          .leftJoinAndSelect('order.shipper', 'shipper')
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
    query.skip((page - 1) * limit).take(limit);

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

  async getSellerOrderStats(sellerId: number) {
    const [statusStats, revenueData] = await Promise.all([
      // 1. Đếm số lượng đơn hàng theo từng trạng thái
      this.orderRepository
        .createQueryBuilder('order')
        .select('order.status', 'status')
        .addSelect('COUNT(order.id)', 'count')
        .where('order.seller_id = :sellerId', { sellerId })
        .groupBy('order.status')
        .getRawMany(),

      // 2. Tính tổng doanh thu từ các đơn hàng thành công (success)
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'totalRevenue')
        .where('order.seller_id = :sellerId', { sellerId })
        .andWhere('order.status = :status', { status: 'success' })
        .getRawOne(),
    ]);

    // 3. Format lại dữ liệu để Frontend dễ dùng
    const stats = {
      pending: 0,
      confirmed: 0,
      shipping: 0,
      success: 0,
      cancelled: 0,
      failed: 0,
      totalOrders: 0,
      revenue: parseFloat(revenueData?.totalRevenue || 0),
    };

    statusStats.forEach((item) => {
      const count = parseInt(item.count);
      stats[item.status] = count;
      stats.totalOrders += count;
    });

    return stats;
  }

  // Thêm 2 method này vào OrdersService

  async getShipperHistory(
    shipperId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const query = this.dataSource.manager
      .createQueryBuilder(Order, 'order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
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
      )
      .leftJoinAndSelect('order.seller', 'seller')
      .where('order.shipper_id = :shipperId', { shipperId })
      // Chỉ lấy đơn đã kết thúc (thành công hoặc thất bại)
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['success', 'failed'],
      })
      .orderBy('order.updatedAt', 'DESC')
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

  async getShipperStats(shipperId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Query tổng hợp tất cả trạng thái của shipper này
    const raw = await this.dataSource.manager
      .createQueryBuilder(Order, 'order')
      .select([
        // Đang giao
        `COUNT(CASE WHEN order.status = 'shipping' THEN 1 END) AS shipping`,
        // Hoàn thành hôm nay
        `COUNT(CASE WHEN order.status = 'success' AND order.updatedAt >= :today AND order.updatedAt < :tomorrow THEN 1 END) AS completedToday`,
        // Tổng hoàn thành
        `COUNT(CASE WHEN order.status = 'success' THEN 1 END) AS totalCompleted`,
        // Tổng thất bại
        `COUNT(CASE WHEN order.status = 'failed' THEN 1 END) AS totalFailed`,
        // Tổng đã từng nhận (để tính tỷ lệ)
        `COUNT(CASE WHEN order.status IN ('success', 'failed') THEN 1 END) AS totalDone`,
      ])
      .where('order.shipper_id = :shipperId', { shipperId })
      .setParameters({ today, tomorrow })
      .getRawOne();

    const totalDone = Number(raw.totalDone) || 0;
    const totalCompleted = Number(raw.totalCompleted) || 0;

    return {
      shipping: Number(raw.shipping) || 0,
      completedToday: Number(raw.completedToday) || 0,
      totalCompleted,
      totalFailed: Number(raw.totalFailed) || 0,
      // Tỷ lệ giao thành công (%), null nếu chưa có đơn nào
      successRate:
        totalDone > 0
          ? Math.round((totalCompleted / totalDone) * 100 * 10) / 10
          : null,
    };
  }

  async getSellerCustomers(
    sellerId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    // Query lấy danh sách khách hàng và thống kê con số của họ tại Shop
    const query = this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.user', 'customer')
      .select([
        'customer.id AS id',
        'customer.fullName AS fullName',
        'customer.email AS email',
        'customer.phoneNumber AS phoneNumber',
        'COUNT(order.id) AS totalOrders',
        'SUM(order.totalAmount) AS totalSpent',
        'MAX(order.createdAt) AS lastOrderDate',
      ])
      .where('order.seller_id = :sellerId', { sellerId })
      .groupBy('customer.id')
      .orderBy('totalSpent', 'DESC') // Ưu tiên khách chi nhiều tiền nhất lên đầu
      .limit(limit)
      .offset(skip);

    const customers = await query.getRawMany();

    // Đếm tổng số khách duy nhất để phân trang
    const totalRaw = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(DISTINCT(order.user))', 'count')
      .where('order.seller_id = :sellerId', { sellerId })
      .getRawOne();

    return {
      data: customers.map((c) => ({
        ...c,
        totalSpent: parseFloat(c.totalSpent),
        totalOrders: parseInt(c.totalOrders),
      })),
      total: parseInt(totalRaw.count),
    };
  }

  async getSellerCustomerStats(sellerId: number) {
    const rawStats = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'COUNT(DISTINCT(order.user)) AS totalCustomers',
        'SUM(order.totalAmount) AS totalRevenue',
      ])
      .where('order.seller_id = :sellerId', { sellerId })
      .andWhere('order.status = :status', { status: 'success' })
      .getRawOne();

    // Đếm khách hàng quay lại (mua > 1 đơn)
    const returningRaw = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.user')
      .where('order.seller_id = :sellerId', { sellerId })
      .groupBy('order.user')
      .having('COUNT(order.id) > 1')
      .getRawMany();

    return {
      totalCustomers: parseInt(rawStats.totalCustomers || 0),
      returningCustomers: returningRaw.length,
      avgCustomerValue:
        rawStats.totalCustomers > 0
          ? parseFloat(rawStats.totalRevenue) /
            parseInt(rawStats.totalCustomers)
          : 0,
    };
  }

  // ADMIN
  async findAllOrdersAdmin(
    page: number,
    limit: number,
    status?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.user', 'customer') // Sử dụng Join thay vì JoinAndSelect để tùy biến select
      .leftJoin('order.seller', 'seller')
      .leftJoin('order.shipper', 'shipper')
      .leftJoin('order.items', 'items')
      .select([
        'order.id',
        'order.orderNumber',
        'order.totalAmount',
        'order.status',
        'order.paymentStatus',
        'order.createdAt',
        'customer.fullName', // Lấy từ alias customer
        'customer.email',
        'seller.fullName', // Lấy từ alias seller
        'seller.email',
        'shipper.fullName', // Lấy từ alias shipper
      ]);

    // Các logic andWhere giữ nguyên...
    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(order.orderNumber LIKE :search OR customer.fullName LIKE :search OR seller.fullName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await query
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Mapping lại dữ liệu vì QueryBuilder khi dùng .select cụ thể đôi khi map customer vào trường 'user'
    const mappedData = items.map((item) => ({
      ...item,
      customer: (item as any).user || (item as any).customer, // Đảm bảo luôn có object customer
    }));

    return {
      data: mappedData,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async adminForceUpdateStatus(id: number, status: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
    }

    // Danh sách status hợp lệ (ông có thể import từ Entity nếu dùng Enum)
    const validStatuses = [
      'pending',
      'confirmed',
      'shipped',
      'success',
      'failed',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    // Nếu chuyển thành 'success' và thanh toán COD thì cập nhật luôn paymentStatus
    if (status === 'success' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'paid';
    }

    order.status = status as any;
    await this.orderRepository.save(order);

    return {
      message: `Admin đã cập nhật trạng thái đơn hàng #${id} thành ${status.toUpperCase()}`,
      data: order,
    };
  }

  async getAdminGlobalStats() {
    const [statusStats, revenueData, generalCount] = await Promise.all([
      // 1. Đếm đơn hàng theo từng trạng thái trên toàn sàn
      this.orderRepository
        .createQueryBuilder('order')
        .select('order.status', 'status')
        .addSelect('COUNT(order.id)', 'count')
        .groupBy('order.status')
        .getRawMany(),

      // 2. Tổng doanh thu từ các đơn thành công toàn hệ thống
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'totalRevenue')
        .where('order.status = :status', { status: 'success' })
        .getRawOne(),

      // 3. Tổng số khách hàng đã từng đặt hàng
      this.orderRepository
        .createQueryBuilder('order')
        .select('COUNT(DISTINCT(order.user))', 'customerCount')
        .getRawOne(),
    ]);

    const stats = {
      pending: 0,
      confirmed: 0,
      shipping: 0,
      success: 0,
      failed: 0,
      cancelled: 0,
      totalOrders: 0,
      totalRevenue: parseFloat(revenueData?.totalRevenue || 0),
      totalCustomers: parseInt(generalCount?.customerCount || 0),
    };

    statusStats.forEach((item) => {
      const count = parseInt(item.count);
      stats[item.status] = count;
      stats.totalOrders += count;
    });

    return stats;
  }

  // NOTIFICATION FUNCTION
  // --- Khi USER đặt hàng → thông báo đến từng SELLER ---
  // Thêm vào cuối method createOrderFromCart()
  async notifyOrderPlaced(
    orderNumber: string,
    sellerIds: number[],
    orderId: number,
  ) {
    await this.notificationsService.createMany(
      sellerIds.map((sellerId) => ({
        recipientId: sellerId,
        type: NotificationType.ORDER_PLACED,
        title: 'Đơn hàng mới',
        body: `Bạn có đơn hàng mới ${orderNumber} đang chờ xác nhận.`,
        orderId,
      })),
    );
  }

  // --- Khi SELLER xác nhận đơn → thông báo đến USER ---
  // Thêm vào cuối method sellerConfirmOrder()
  async notifyOrderConfirmed(
    orderNumber: string,
    userId: number,
    orderId: number,
  ) {
    await this.notificationsService.create({
      recipientId: userId,
      type: NotificationType.ORDER_CONFIRMED,
      title: 'Đơn hàng được xác nhận',
      body: `Đơn hàng ${orderNumber} đã được người bán xác nhận và đang chuẩn bị hàng.`,
      orderId,
    });
  }

  // --- Khi USER/SELLER hủy đơn → thông báo đến bên còn lại ---
  // Thêm vào cuối method cancelOrder()
  async notifyCancelledByUser(
    orderNumber: string,
    sellerId: number,
    orderId: number,
  ) {
    await this.notificationsService.create({
      recipientId: sellerId,
      type: NotificationType.ORDER_CANCELLED_BY_USER,
      title: 'Đơn hàng bị hủy',
      body: `Khách hàng đã hủy đơn hàng ${orderNumber}.`,
      orderId,
    });
  }

  async notifyCancelledBySeller(
    orderNumber: string,
    userId: number,
    orderId: number,
  ) {
    await this.notificationsService.create({
      recipientId: userId,
      type: NotificationType.ORDER_CANCELLED_BY_SELLER,
      title: 'Đơn hàng bị từ chối',
      body: `Đơn hàng ${orderNumber} đã bị người bán từ chối.`,
      orderId,
    });
  }

  // --- Khi SHIPPER nhận đơn → thông báo đến SELLER ---
  // Thêm vào cuối method shipperPickUpOrder()
  async notifyShipperPickedUp(
    orderNumber: string,
    shipperName: string,
    sellerId: number,
    orderId: number,
  ) {
    await this.notificationsService.create({
      recipientId: sellerId,
      type: NotificationType.SHIPPER_PICKED_UP,
      title: 'Shipper đã nhận hàng',
      body: `Shipper ${shipperName} đã nhận đơn hàng ${orderNumber} và đang trên đường giao.`,
      orderId,
    });
  }

  // --- Khi SHIPPER giao thành công → thông báo đến SELLER + USER ---
  // Thêm vào cuối method shipperCompleteOrder()
  async notifyOrderDelivered(
    orderNumber: string,
    sellerId: number,
    userId: number,
    orderId: number,
  ) {
    await this.notificationsService.createMany([
      {
        recipientId: sellerId,
        type: NotificationType.ORDER_DELIVERED,
        title: 'Giao hàng thành công',
        body: `Đơn hàng ${orderNumber} đã được giao thành công đến khách hàng.`,
        orderId,
      },
      {
        recipientId: userId,
        type: NotificationType.ORDER_DELIVERED,
        title: 'Đơn hàng đã được giao',
        body: `Đơn hàng ${orderNumber} đã được giao thành công. Cảm ơn bạn đã mua hàng!`,
        orderId,
      },
    ]);
  }

  // --- Khi SHIPPER giao thất bại → thông báo đến SELLER + USER ---
  // Thêm vào cuối method shipperFailOrder()
  async notifyOrderFailed(
    orderNumber: string,
    sellerId: number,
    userId: number,
    orderId: number,
  ) {
    await this.notificationsService.createMany([
      {
        recipientId: sellerId,
        type: NotificationType.ORDER_FAILED,
        title: 'Giao hàng thất bại',
        body: `Đơn hàng ${orderNumber} giao thất bại. Vui lòng liên hệ shipper để xử lý.`,
        orderId,
      },
      {
        recipientId: userId,
        type: NotificationType.ORDER_FAILED,
        title: 'Giao hàng thất bại',
        body: `Đơn hàng ${orderNumber} không thể giao đến bạn. Chúng tôi sẽ liên hệ sớm.`,
        orderId,
      },
    ]);
  }

  async getAdminRecentOrders(limit: number = 5) {
    const orders = await this.dataSource.manager
      .createQueryBuilder(Order, 'order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
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
      )
      .leftJoin('order.seller', 'seller')
      .addSelect(['seller.id', 'seller.fullName'])
      .leftJoin('order.user', 'customer')
      .addSelect(['customer.id', 'customer.fullName', 'customer.email'])
      .orderBy('order.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return { data: orders };
  }
}
