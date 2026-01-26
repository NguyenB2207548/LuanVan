// src/modules/products/attributes.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from './entities/attribute.entity';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
  ) {}

  async findAll(): Promise<Attribute[]> {
    return await this.attributeRepository.find({
      relations: ['attributeValues'], // Lấy kèm danh sách giá trị (vd: Đỏ, Xanh, XL, L)
      order: {
        attributeName: 'ASC',
      },
    });
  }
}
