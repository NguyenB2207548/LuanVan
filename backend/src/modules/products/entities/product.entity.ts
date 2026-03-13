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
import { Variant } from './variant.entity';
import { Attribute } from './attribute.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { User } from '../../users/entities/user.entity';
import { Image } from '../../images/entities/image.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_name', length: 255 })
  productName: string;

  @Column({ type: 'text', nullable: true })
  description: string | undefined;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active',
  })
  status: string;

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

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

  @OneToMany(() => Image, (image) => image.product)
  images: Image[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
