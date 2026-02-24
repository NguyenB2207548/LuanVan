// src/modules/products/attributes.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from './entities/attribute.entity';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { AttributeValue } from './entities/attribute_value.entity';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    @InjectRepository(AttributeValue)
    private readonly attributeValueRepository: Repository<AttributeValue>,
  ) {}

  async findAll(): Promise<Attribute[]> {
    return await this.attributeRepository.find({
      relations: ['attributeValues'],
      order: {
        attributeName: 'ASC',
      },
    });
  }

  async create(createAttributeDto: CreateAttributeDto) {
    const existingAttribute = await this.attributeRepository.findOne({
      where: { attributeName: createAttributeDto.name },
    });

    if (existingAttribute) {
      throw new ConflictException(
        `Thuộc tính "${createAttributeDto.name}" đã tồn tại trên hệ thống!`,
      );
    }

    const newAttribute = this.attributeRepository.create({
      attributeName: createAttributeDto.name,
    });
    const savedAttribute = await this.attributeRepository.save(newAttribute);

    return savedAttribute;
  }

  async addAttributeValue(dto: CreateAttributeValueDto) {
    const attribute = await this.attributeRepository.findOne({
      where: { id: dto.attributeId },
    });

    if (!attribute) {
      throw new NotFoundException('Không tìm thấy thuộc tính cha!');
    }

    const existingValue = await this.attributeValueRepository.findOne({
      where: {
        valueName: dto.valueName,
        attribute: { id: dto.attributeId },
      },
    });

    if (existingValue) {
      throw new ConflictException(
        `Giá trị "${dto.valueName}" đã tồn tại trong thuộc tính này!`,
      );
    }

    const newValue = this.attributeValueRepository.create({
      valueName: dto.valueName,
      attribute: { id: dto.attributeId },
    });

    return await this.attributeValueRepository.save(newValue);
  }

  async deleteAttribute(id: number) {
    const attribute = await this.attributeRepository.findOne({
      where: { id },
    });

    if (!attribute) {
      throw new NotFoundException('Không tìm thấy thuộc tính!');
    }

    return await this.attributeRepository.remove(attribute);
  }

  async deleteAttributeValue(id: number) {
    const value = await this.attributeValueRepository.findOne({
      where: { id },
    });

    if (!value) {
      throw new NotFoundException('Không tìm thấy giá trị thuộc tính!');
    }

    return await this.attributeValueRepository.remove(value);
  }
}
