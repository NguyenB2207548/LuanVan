import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Variant } from './entities/variant.entity';
import { CreateVariantDto } from './dto/create-variant.dto';
import { AttributeValue } from './entities/attribute_value.entity';

@Injectable() // BẮT BUỘC PHẢI CÓ
export class VariantsService {
  constructor(
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    return await this.variantRepository.find();
  }

  // Lấy danh sách kèm theo các giá trị thuộc tính (để Frontend hiển thị được Màu, Size)
  async findVariantsByProductId(productId: number): Promise<Variant[]> {
    return this.variantRepository.find({
      where: { product: { id: productId } },
      relations: ['attributeValues', 'attributeValues.attribute', 'images'],
    });
  }

  async createVariants(productId: number, createVariantDto: CreateVariantDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { stock, attributeValueIds, price, sku } = createVariantDto;

      // 1. Tạo Variant
      // Lưu ý: attributeValues nhận vào mảng object có ID
      const variant = queryRunner.manager.create(Variant, {
        product: { id: productId },
        stock,
        price, // Lưu trực tiếp vào Variant như Entity đã định nghĩa
        sku: sku || `SKU-${productId}-${Date.now()}`,
        attributeValues: attributeValueIds.map((id) => ({ id })),
      });

      const savedVariant = await queryRunner.manager.save(variant);

      // 2. Nếu có ảnh đi kèm trong DTO (từ bước trước)
      if (createVariantDto.images?.length) {
        // Xử lý lưu ảnh variant ở đây nếu cần
      }

      await queryRunner.commitTransaction();
      return savedVariant;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Không thể tạo biến thể: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: number): Promise<void> {
    const result = await this.variantRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy biến thể #${id} để xóa`);
    }
  }
}
