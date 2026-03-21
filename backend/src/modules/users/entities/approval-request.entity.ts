import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User, UserRole } from './user.entity';

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('approval_requests')
export class ApprovalRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    comment: 'Role mà người dùng muốn nâng cấp lên (seller hoặc shipper)',
  })
  requestedRole: UserRole;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  // --- DỮ LIỆU DÀNH CHO SELLER ---
  @Column({ name: 'shop_name', length: 150, nullable: true })
  shopName: string;

  @Column({ name: 'shop_address', type: 'text', nullable: true })
  shopAddress: string;

  // --- DỮ LIỆU DÀNH CHO SHIPPER ---
  @Column({ name: 'vehicle_plate', length: 20, nullable: true })
  vehiclePlate: string;

  @Column({ name: 'shipper_address', type: 'text', nullable: true })
  shipperAddress: string; // Thay thế cho vehicleType

  // --- PHẢN HỒI TỪ ADMIN ---
  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}