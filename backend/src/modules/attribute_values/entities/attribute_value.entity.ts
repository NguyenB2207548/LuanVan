import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { Attribute } from '../../attributes/entities/attribute.entity';
import { Variant } from '../../variants/entities/variant.entity';

@Entity('attribute_values')
export class AttributeValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'value_name' })
  valueName: string; // Ví dụ: "Đỏ", "L"

  @ManyToOne(() => Attribute, (attribute) => attribute.attributeValues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attribute_id' })
  attribute: Attribute;

  @ManyToMany(() => Variant, (variant) => variant.attributeValues)
  variants: Variant[];
}
