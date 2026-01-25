import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Category } from '../../categorys/entities/category.entity';
import { Variant } from 'src/modules/variants/entities/variant.entity';
import { Attribute } from 'src/modules/attributes/entities/attribute.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_name', length: 255 })
  productName: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  description: string | undefined;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Variant, (variant) => variant.product)
  variants: Variant[];

  @ManyToMany(() => Attribute, (attribute) => attribute.products)
  @JoinTable({
    name: 'product_attributes',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'attribute_id', referencedColumnName: 'id' },
  })
  attributes: Attribute[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
