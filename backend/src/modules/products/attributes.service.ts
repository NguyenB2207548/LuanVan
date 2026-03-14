// src/modules/products/attributes.service.ts
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
  logger: any;
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
    try {
      const isExist = await this.attributeRepository
        .createQueryBuilder('attr')
        .where('attr.attributeName = :name', {
          name: createAttributeDto.attributeName,
        })
        .getExists();

      if (isExist) {
        throw new ConflictException(
          `Thuộc tính "${createAttributeDto.attributeName}" đã tồn tại trên hệ thống!`,
        );
      }

      const newAttribute = this.attributeRepository.create({
        attributeName: createAttributeDto.attributeName,
      });

      return await this.attributeRepository.save(newAttribute);
    } catch (error) {
      this.logger.error(
        `Lỗi khi tạo thuộc tính: ${error.message}`,
        error.stack,
      );

      if (error instanceof ConflictException) throw error;

      throw new InternalServerErrorException(
        'Không thể tạo thuộc tính mới vào lúc này',
      );
    }
  }

  async addAttributeValue(dto: CreateAttributeValueDto) {
    const isParentExist = await this.attributeRepository
      .createQueryBuilder('attr')
      .where('attr.id = :id', { id: dto.attributeId })
      .getExists();

    if (!isParentExist) {
      throw new NotFoundException('Không tìm thấy thuộc tính cha!');
    }

    const existingValue = await this.attributeValueRepository.findOne({
      where: {
        valueName: dto.valueName,
        attributeId: dto.attributeId,
      },
    });

    if (existingValue) {
      throw new ConflictException(
        `Giá trị "${dto.valueName}" đã tồn tại trong thuộc tính này!`,
      );
    }

    try {
      const newValue = this.attributeValueRepository.create({
        valueName: dto.valueName,
        attributeId: dto.attributeId,
      });

      return await this.attributeValueRepository.save(newValue);
    } catch (error) {
      this.logger.error(`Lỗi khi tạo giá trị thuộc tính: ${error.message}`);
      throw new InternalServerErrorException('Lỗi hệ thống khi lưu giá trị');
    }
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
