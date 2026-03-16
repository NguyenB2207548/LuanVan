import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Design } from './design.entity';
import { User } from '../../users/entities/user.entity';

@Entity('artworks')
export class Artwork {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'artwork_name', length: 255, nullable: true })
  artworkName: string;

  @Column({ type: 'text', comment: 'Lưu trữ JSON chi tiết các layer' })
  layersJson: string;

  @ManyToOne(() => User, (user) => user.artworks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @OneToMany(() => Design, (design) => design.artwork)
  designs: Design[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
