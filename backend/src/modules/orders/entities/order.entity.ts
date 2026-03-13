import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: [
      'pending', // Khách hàng vừa đặt đơn (Chờ Seller xác nhận)
      'confirmed', // Seller đã xác nhận & đang chuẩn bị hàng (Chờ Shipper nhận đơn)
      'shipping', // Shipper đang đi giao
      'delivered', // Đã giao xong (Hoàn thành)
      'cancelled', // Đã hủy (Bởi khách hoặc Seller)
    ],
    default: 'pending',
  })
  status: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'shipper_id' })
  shipper: User;

  // --- THÔNG TIN BỔ SUNG ---
  @Column({ name: 'recipient_name' })
  recipientName: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'text' })
  shippingAddress: string;

  @Column({ name: 'payment_method', default: 'COD' })
  paymentMethod: string;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  })
  paymentStatus: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
