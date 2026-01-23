import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Design } from './design.entity';

export enum DesignOptionType {
  TEXT = 'text',
  UPLOAD = 'upload',
  IMAGE_GROUP = 'image_group', // Chọn từ bộ sưu tập có sẵn
}

@Entity('design_options')
export class DesignOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column({
    type: 'enum',
    enum: DesignOptionType,
  })
  optionType: DesignOptionType;

  @Column({ name: 'target_layer_id' })
  targetLayerId: string; // ID của layer trong JSON để map dữ liệu vào

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Cấu hình thêm như font, giới hạn ký tự, size ảnh',
  })
  config: any;

  @ManyToOne(() => Design, (design) => design.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'design_id' })
  design: Design;
}
