import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ShipperWorkStatus {
  READY = 'ready',
  BUSY = 'busy',
  OFF = 'off',
}

@Entity('shipper_profiles')
export class ShipperProfile {
  @PrimaryColumn()
  userId: number;

  @Column({
    name: 'vehicle_plate',
    length: 20,
    unique: true,
  })
  vehiclePlate: string;

  @Column({
    name: 'vehicle_type',
    type: 'varchar',
    length: 50,
    default: 'motorcycle',
  })
  vehicleType: string;

  @Column({
    name: 'work_status',
    type: 'enum',
    enum: ShipperWorkStatus, // Dùng enum đã định nghĩa
    default: ShipperWorkStatus.READY,
  })
  workStatus: ShipperWorkStatus;

  @Column({ name: 'total_orders_completed', default: 0 })
  totalOrdersCompleted: number;

  @OneToOne(() => User, (user) => user.shipperProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
