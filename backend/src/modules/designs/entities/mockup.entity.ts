import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Variant } from '../../products/entities/variant.entity';
import { PrintArea } from './print_area.entity';

@Entity('mockups')
export class Mockup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string; // Đảm bảo có dòng này

  // Liên kết với Product
  @OneToOne(() => Product, (product) => product.design, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id', nullable: true })
  productId: number;

  // Liên kết với Variant
  @OneToOne(() => Variant, (variant) => variant.mockup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;

  @Column({ name: 'variant_id', nullable: true })
  variantId: number;

  @OneToOne(() => PrintArea, (printArea) => printArea.mockup, { cascade: true })
  printArea: PrintArea;
}
