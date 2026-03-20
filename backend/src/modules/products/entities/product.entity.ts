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
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';
import { Category } from '../../categorys/entities/category.entity';
import { Variant } from './variant.entity';
import { Attribute } from './attribute.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { User } from '../../users/entities/user.entity';
import { Image } from '../../images/entities/image.entity';
import { Design } from 'src/modules/designs/entities/design.entity';
import { Mockup } from 'src/modules/designs/entities/mockup.entity';

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

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, select: false })
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToMany(() => Category, (category) => category.products, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'products_categories',
    joinColumn: {
      name: 'product_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'category_id',
      referencedColumnName: 'id',
    },
  })
  categories: Category[];

  @OneToMany(() => Variant, (variant) => variant.product, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  variants: Variant[];

  @ManyToMany(() => Attribute, (attribute) => attribute.products, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'product_attributes',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'attribute_id', referencedColumnName: 'id' },
  })
  attributes: Attribute[];

  @OneToMany(() => Image, (image) => image.product, {
    onDelete: 'CASCADE',
  })
  images: Image[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToOne(() => Design, (design) => design.product)
  design: Design;

  @OneToOne(() => Mockup, (mockup) => mockup.product, {
    onDelete: 'CASCADE',
  })
  mockup: Mockup;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
