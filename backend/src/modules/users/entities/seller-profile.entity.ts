import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('seller_profiles')
export class SellerProfile {
  @PrimaryColumn()
  userId: number;

  @Column({ name: 'shop_name', length: 150 })
  shopName: string;

  @Column({ type: 'text' })
  shopAddress: string;

  // @Column({ name: 'contact_number', length: 20, nullable: true })
  // contactNumber: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  // Quan hệ 1:1 trỏ ngược về bảng User
  @OneToOne(() => User, (user) => user.sellerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
