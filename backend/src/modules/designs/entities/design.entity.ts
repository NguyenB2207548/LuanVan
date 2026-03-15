import { Product } from 'src/modules/products/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Artwork } from './artwork.entity';

@Entity('designs')
export class Design {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // 1-1 với Product: Mỗi sản phẩm có một cấu trúc thiết kế mẫu
  @OneToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // 1-N với Artworks: Chứa các layer mặc định do Seller thiết lập
  @OneToMany(() => Artwork, (artwork) => artwork.design, { cascade: true })
  artworks: Artwork[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
