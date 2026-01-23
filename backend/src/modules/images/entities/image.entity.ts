import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ImageOwnerType {
  PRODUCT = 'product',
  REVIEW = 'review',
  CATEGORY = 'category',
  VARIANT = 'variant',
}

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column({
    type: 'enum',
    enum: ImageOwnerType,
  })
  ownerType: ImageOwnerType;

  @Column()
  ownerId: number;

  @Column({ default: false })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
