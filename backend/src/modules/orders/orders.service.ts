import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../carts/entities/cart-item.entity';
import { Variant } from '../products/entities/variant.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  Image as ImageEntity,
  ImageOwnerType,
} from '../images/entities/image.entity';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { MomoService } from './momo.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly momoService: MomoService,
  ) {}

  async getAllOrders() {
    // 1. Lấy toàn bộ đơn hàng kèm thông tin User và Sản phẩm
    const orders = await this.dataSource.manager.find(Order, {
      relations: [
        'user', // QUAN TRỌNG: Kéo theo user để biết email/tên tài khoản người đặt
        'items',
        'items.variant',
        'items.variant.product',
      ],
      order: { createdAt: 'DESC' }, // Đơn mới nhất luôn lên đầu
    });

    if (!orders || orders.length === 0) {
      return [];
    }

    // 2. Lấy hình ảnh (áp dụng logic Polymorphic cũ để giao diện Admin có ảnh hiển thị)
    for (const order of orders) {
      for (const item of order.items) {
        if (item.variant) {
          // Ảnh của Variant
          item.variant['images'] = await this.dataSource.manager.find(
            ImageEntity,
            {
              where: {
                ownerId: item.variant.id,
                ownerType: ImageOwnerType.VARIANT,
              },
            },
          );

          // Ảnh của Product gốc
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
    }

    return orders;
  }

  async getUserOrders(userId: number) {
    // 1. Truy vấn các đơn hàng của user kèm theo các relations cơ bản
    const orders = await this.dataSource.manager.find(Order, {
      where: { user: { id: userId } },
      relations: ['items', 'items.variant', 'items.variant.product'],
      order: { createdAt: 'DESC' }, // Sắp xếp đơn hàng mới nhất lên đầu
    });

    if (!orders || orders.length === 0) {
      return [];
    }

    // 2. Xử lý lấy hình ảnh thủ công (Do dùng Polymorphic relation ownerId/ownerType)
    for (const order of orders) {
      for (const item of order.items) {
        if (item.variant) {
          // Lấy ảnh của biến thể (Variant)
          item.variant['images'] = await this.dataSource.manager.find(
            ImageEntity,
            {
              where: {
                ownerId: item.variant.id,
                ownerType: ImageOwnerType.VARIANT,
              },
            },
          );

          // Lấy ảnh của sản phẩm gốc (Product)
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
    }

    return orders;
  }

  async getOrderById(orderId: number) {
    // 1. Tìm đơn hàng kèm theo các thông tin liên quan
    const order = await this.dataSource.manager.findOne(Order, {
      where: { id: orderId },
      relations: [
        'user', // Lấy thông tin tài khoản đặt hàng (email, họ tên...)
        'items', // Lấy danh sách sản phẩm trong đơn
        'items.variant',
        'items.variant.product',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${orderId}`);
    }

    // 2. Lấy hình ảnh (áp dụng logic Polymorphic) để hiển thị trên giao diện chi tiết
    for (const item of order.items) {
      if (item.variant) {
        // Ảnh của Variant
        item.variant['images'] = await this.dataSource.manager.find(
          ImageEntity,
          {
            where: {
              ownerId: item.variant.id,
              ownerType: ImageOwnerType.VARIANT,
            },
          },
        );

        // Ảnh của Product gốc
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

    return order;
  }

  async getOrderItemDesign(itemId: number) {
    const orderItem = await this.dataSource.manager.findOne(OrderItem, {
      where: { id: itemId },
      select: ['id', 'customizedDesignJson'],
    });

    if (!orderItem) {
      throw new NotFoundException(
        `Không tìm thấy sản phẩm trong đơn hàng với ID: ${itemId}`,
      );
    }

    if (!orderItem.customizedDesignJson) {
      throw new NotFoundException(
        'Sản phẩm này không có thiết kế cá nhân hóa đi kèm.',
      );
    }

    return {
      itemId: orderItem.id,
      design: orderItem.customizedDesignJson,
    };
  }

  async findByOrderNumber(orderNumber: string) {
    return await this.dataSource.manager.findOne(Order, {
      where: { orderNumber },
    });
  }

  async saveOrder(order: Order) {
    return await this.dataSource.manager.save(Order, order);
  }

  async createOrderFromCart(userId: number, dto: CreateOrderDto) {
    // Bắt đầu Transaction để đảm bảo tính toàn vẹn dữ liệu
    return await this.dataSource.transaction(async (manager) => {
      // 1. Lấy Giỏ hàng hiện tại của User
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: [
          'items',
          'items.variant',
          'items.variant.product', // Kéo thêm product để lấy tên báo lỗi cho mượt
          'items.variant.prices',
        ],
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException(
          'Giỏ hàng của bạn đang trống, không thể đặt hàng!',
        );
      }

      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      // 2. Xử lý từng sản phẩm trong giỏ
      for (const cartItem of cart.items) {
        const variant = cartItem.variant;

        // a. Kiểm tra tồn kho
        if (variant.stock < cartItem.quantity) {
          const productName =
            variant.product?.productName || `Mã phân loại ${variant.id}`;
          throw new BadRequestException(
            `Sản phẩm "${productName}" không đủ số lượng trong kho. Chỉ còn lại ${variant.stock}.`,
          );
        }

        // b. Trừ tồn kho
        variant.stock -= cartItem.quantity;
        await manager.save(Variant, variant);

        // c. Lấy giá hiện tại để chốt vào đơn hàng
        if (!variant.prices || variant.prices.length === 0) {
          throw new BadRequestException(
            `Sản phẩm ${variant.id} đang bị lỗi giá, vui lòng liên hệ admin.`,
          );
        }
        const currentPrice = parseFloat(variant.prices[0].amount.toString());
        totalAmount += currentPrice * cartItem.quantity;

        // d. Tạo bản ghi OrderItem (Nhớ copy customizedDesignJson sang)
        const orderItem = manager.create(OrderItem, {
          variant: { id: variant.id },
          quantity: cartItem.quantity,
          priceAtPurchase: currentPrice,
          customizedDesignJson: cartItem.customizedDesignJson, // Sang dữ liệu thiết kế từ giỏ hàng qua đơn
        });

        orderItems.push(orderItem);
      }

      // 3. Tạo mã đơn hàng duy nhất (Ví dụ: ORD-1712345678-2)
      const orderNumber = `ORD-${Date.now()}-${userId}`;

      // 4. Thiết lập trạng thái thanh toán ban đầu
      // Dù là COD hay VNPAY thì lúc vừa đặt xong đều chưa thu được tiền thực tế -> 'pending'
      const initialPaymentStatus = 'pending';

      // 5. Lưu Đơn hàng (Order)
      const newOrder = manager.create(Order, {
        orderNumber,
        totalAmount,
        recipientName: dto.recipientName,
        phoneNumber: dto.phoneNumber,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod,
        paymentStatus: initialPaymentStatus,
        status: 'pending', // Đơn mới tạo luôn ở trạng thái chờ xác nhận
        user: { id: userId },
        items: orderItems, // Nhờ cascade: true, TypeORM sẽ tự lưu mảng orderItems này vào DB
      });

      const savedOrder = await manager.save(Order, newOrder);

      // 6. Xóa sạch các sản phẩm trong Giỏ hàng sau khi đặt thành công
      await manager.remove(CartItem, cart.items);

      let payUrl = null;
      if (dto.paymentMethod === 'VNPAY' || dto.paymentMethod === 'MOMO') {
        // Gọi hàm của MomoService (đảm bảo bạn đã inject MomoService vào constructor)
        payUrl = await this.momoService.createPaymentUrl(savedOrder);
      }

      return {
        order: savedOrder,
        payUrl: payUrl, // Sẽ là link MoMo (nếu có) hoặc null (nếu là COD)
      };
    });
  }

  async updateOrderStatus(orderId: number, dto: UpdateOrderStatusDto) {
    const order = await this.dataSource.manager.findOne(Order, {
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${orderId}`);
    }

    // Cập nhật trạng thái
    order.status = dto.status;

    // Nếu bạn muốn tự động cập nhật paymentStatus thành 'paid' khi đơn hàng chuyển sang 'delivered' đối với đơn COD,
    // có thể thêm logic ở đây:
    if (dto.status === 'delivered' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'paid';
    }

    // Lưu lại vào database
    return await this.dataSource.manager.save(Order, order);
  }
}
