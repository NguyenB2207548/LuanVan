import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

// Toàn bộ các loại trigger thông báo trong hệ thống
export enum NotificationType {
    // --- USER đặt hàng → SELLER nhận ---
    ORDER_PLACED = 'ORDER_PLACED',

    // --- SELLER xử lý → USER nhận ---
    ORDER_CONFIRMED = 'ORDER_CONFIRMED',
    ORDER_CANCELLED_BY_SELLER = 'ORDER_CANCELLED_BY_SELLER',

    // --- SHIPPER nhận đơn → SELLER nhận ---
    SHIPPER_PICKED_UP = 'SHIPPER_PICKED_UP',

    // --- SHIPPER kết thúc → SELLER + USER nhận ---
    ORDER_DELIVERED = 'ORDER_DELIVERED',
    ORDER_FAILED = 'ORDER_FAILED',

    // --- USER hủy đơn → SELLER nhận ---
    ORDER_CANCELLED_BY_USER = 'ORDER_CANCELLED_BY_USER',
}

@Entity('notifications')
@Index(['recipientId', 'isRead']) // Query thường gặp: lấy thông báo chưa đọc của 1 user
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    // Người nhận thông báo
    @Column({ name: 'recipient_id' })
    recipientId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'recipient_id' })
    recipient: User;

    // Loại thông báo — dùng để frontend render icon/màu phù hợp
    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    // Tiêu đề ngắn gọn
    @Column({ length: 255 })
    title: string;

    // Nội dung chi tiết
    @Column({ type: 'text' })
    body: string;

    // Liên kết đến đơn hàng liên quan (nullable vì có thể mở rộng loại thông báo khác)
    @Column({ name: 'order_id', nullable: true })
    orderId: number | null;

    @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'order_id' })
    order: Order | null;

    // Đã đọc chưa
    @Column({ name: 'is_read', default: false })
    isRead: boolean;

    // Thời điểm đọc (để thống kê nếu cần)
    @Column({ name: 'read_at', type: 'datetime', nullable: true })
    readAt: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}