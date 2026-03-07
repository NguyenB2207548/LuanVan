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
  orderNumber: string; // Mã đơn hàng (VD: ORD-123456)

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  // --- TRẠNG THÁI ĐƠN HÀNG VÀ VẬN CHUYỂN ---
  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'tracking_code', nullable: true })
  trackingCode: string;

  // --- THÔNG TIN GIAO HÀNG ---
  @Column({ name: 'recipient_name' })
  recipientName: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'text' })
  shippingAddress: string;

  // --- THÔNG TIN THANH TOÁN (---
  @Column({ name: 'payment_method', default: 'COD' })
  paymentMethod: string; // VD: 'COD', 'VNPAY'

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  })
  paymentStatus: string;

  // --- QUAN HỆ CƠ SỞ DỮ LIỆU ---
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  // --- THỜI GIAN ---
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
