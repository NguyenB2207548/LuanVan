import { InjectRepository } from '@nestjs/typeorm';
import { Variant } from './entities/variant.entity';
import { Repository, DataSource } from 'typeorm';
// import { DataSource } from 'typeorm/browser';
import { CreateVariantDto } from './dto/create-variant.dto';

export class VariantsService {
  constructor(
    @InjectRepository(Variant) private variantRepository: Repository<Variant>,
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<Variant[]> {
    return this.variantRepository.find();
  }

  async findVariantsByProductId(productId: number): Promise<Variant[]> {
    return this.variantRepository.find({
      where: { product: { id: productId } },
    });
  }

  async createVariants(productId: number, createVariantDto: CreateVariantDto) {
    return await this.dataSource.transaction(async (manager) => {
      const { stock, attributeValueIds, price } = createVariantDto;

      // Variant
      const variant = manager.create(Variant, {
        product: { id: productId },
        stock,
        attributeValues: attributeValueIds.map((id) => ({ id })),
      });
      const savedVariant = await manager.save(variant);

      // Price
      if (price) {
        const newPrice = manager.create('Price', {
          amount: price,
          priceType: 'original',
          effectiveDate: new Date(),
          variant: { id: savedVariant.id },
        });
        await manager.save(newPrice);
      }
      return savedVariant;
    });
  }

  async delete(id: number): Promise<void> {
    await this.variantRepository.delete(id);
  }
}
