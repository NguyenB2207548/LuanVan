import { Product } from 'src/modules/products/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
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
  @JoinColumn({ name: 'design_name' })
  designName: string;

  @OneToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Artwork, (artwork) => artwork.designs, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'artwork_id' })
  artwork: Artwork;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
