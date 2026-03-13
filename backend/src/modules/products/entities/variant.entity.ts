import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttributeValue } from './attribute_value.entity';
import { Product } from '../../products/entities/product.entity';
import { Image } from '../../images/entities/image.entity';

@Entity('variants')
export class Variant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToMany(() => AttributeValue, (attrValue) => attrValue.variants)
  @JoinTable({
    name: 'variant_attribute_values',
    joinColumn: { name: 'variant_id' },
    inverseJoinColumn: { name: 'attribute_value_id' },
  })
  attributeValues: AttributeValue[];

  @OneToMany(() => Image, (image) => image.variant)
  images: Image[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
