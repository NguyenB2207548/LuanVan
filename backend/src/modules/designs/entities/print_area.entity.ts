import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Mockup } from './mockup.entity';

@Entity('print_areas')
export class PrintArea {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Mockup, (mockup) => mockup.printArea)
  @JoinColumn({ name: 'mockup_id' })
  mockup: Mockup;

  @Column({ type: 'float' })
  x: number;

  @Column({ type: 'float' })
  y: number;

  @Column({ type: 'float' })
  width: number;

  @Column({ type: 'float' })
  height: number;

  // THÔNG SỐ FILE IN (High-Res)
  @Column({ type: 'float', comment: 'Chiều rộng thực tế vùng in (inch)' })
  realWidthInch: number;

  @Column({ type: 'float', comment: 'Chiều cao thực tế vùng in (inch)' })
  realHeightInch: number;

  @Column({ default: 300, comment: 'DPI mục tiêu để xuất file in' })
  targetDpi: number;
}
