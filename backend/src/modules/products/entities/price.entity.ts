import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Variant } from './variant.entity';

@Entity('prices')
export class Price {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'VND' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['sale', 'original', 'discount'],
    default: 'original',
  })
  priceType: string;

  @CreateDateColumn({ name: 'effective_date' })
  effectiveDate: Date; // Ngày mức giá này bắt đầu có hiệu lực

  @ManyToOne(() => Variant, (variant) => variant.prices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;
}
