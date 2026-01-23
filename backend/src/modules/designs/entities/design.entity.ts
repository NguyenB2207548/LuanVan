import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DesignOption } from './design-option.entity';

@Entity('designs')
export class Design {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'design_name' })
  designName: string;

  @Column({ type: 'json' })
  templateJson: any;

  @OneToMany(() => DesignOption, (option) => option.design)
  options: DesignOption[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
