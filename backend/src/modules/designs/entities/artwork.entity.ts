import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Design } from './design.entity';

@Entity('artworks')
export class Artwork {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Design, (design) => design.artworks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'design_id' })
  design: Design;

  @Column({ type: 'text', comment: 'Lưu trữ JSON chi tiết các layer' })
  layersJson: string;

  @Column({ default: 1, comment: 'Thứ tự hiển thị của artwork' })
  order: number;
}
