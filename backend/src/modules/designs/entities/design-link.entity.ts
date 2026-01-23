import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Design } from './design.entity';
import { Variant } from '../../variants/entities/variant.entity';

@Entity('link_designs')
export class LinkDesign {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Design)
  @JoinColumn({ name: 'design_id' })
  design: Design;

  @ManyToOne(() => Variant)
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;

  @Column({ default: true })
  isActive: boolean;
}
