import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Design } from './design.entity';

export enum DesignOwnerType {
  PRODUCT = 'product',
  VARIANT = 'variant',
}

@Entity('link_designs')
export class LinkDesign {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Design, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'design_id' })
  design: Design;

  @Column({
    type: 'enum',
    enum: DesignOwnerType,
  })
  ownerType: DesignOwnerType;

  @Column()
  ownerId: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
