import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { Variant } from './entities/variant.entity';
import { Attribute } from './entities/attribute.entity';
import { AttributeValue } from './entities/attribute_value.entity';
import { Category } from '../categorys/entities/category.entity';
import { Price } from './entities/price.entity';
import { Image, ImageOwnerType } from '../images/entities/image.entity';

@Injectable()
export class ProductsService {
  constructor(private dataSource: DataSource) {}
  async findAll() {
    const productRepository = this.dataSource.getRepository(Product);
    const imageRepository = this.dataSource.getRepository(Image);

    // 1. Lấy danh sách sản phẩm cơ bản
    const products = await productRepository.find({
      relations: [
        'category',
        'variants',
        'attributes',
        'variants.attributeValues',
        'variants.prices',
      ],
    });

    // 2. Map qua từng sản phẩm để đính kèm ảnh
    return await Promise.all(
      products.map(async (product) => {
        // Lấy ảnh của chính Product đó
        const productImages = await imageRepository.find({
          where: {
            ownerId: product.id,
            ownerType: ImageOwnerType.PRODUCT,
          },
        });

        // Lấy ảnh cho từng Variant của Product đó
        const variantsWithImages = await Promise.all(
          product.variants.map(async (variant) => {
            const variantImages = await imageRepository.find({
              where: {
                ownerId: variant.id,
                ownerType: ImageOwnerType.VARIANT,
              },
            });
            return { ...variant, images: variantImages };
          }),
        );

        return {
          ...product,
          images: productImages,
          variants: variantsWithImages,
        };
      }),
    );
  }

  async findOne(id: number): Promise<any> {
    const productRepository = this.dataSource.getRepository(Product);
    const imageRepository = this.dataSource.getRepository(Image);

    const product = await productRepository.findOne({
      where: { id },
      relations: [
        'category',
        'variants',
        'attributes',
        'variants.attributeValues',
        'variants.prices',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID #${id}`);
    }

    const productImages = await imageRepository.find({
      where: {
        ownerId: product.id,
        ownerType: ImageOwnerType.PRODUCT,
      },
    });

    const variantsWithImages = await Promise.all(
      product.variants.map(async (variant) => {
        const variantImages = await imageRepository.find({
          where: {
            ownerId: variant.id,
            ownerType: ImageOwnerType.VARIANT,
          },
        });
        return { ...variant, images: variantImages };
      }),
    );

    return {
      ...product,
      images: productImages,
      variants: variantsWithImages,
    };
  }

  async create(createProductDto: CreateProductDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { productName, description, categoryId, variants, productImages } =
        createProductDto;

      const category = await queryRunner.manager.findOne(Category, {
        where: { id: categoryId },
      });
      if (!category) throw new BadRequestException('Danh mục không tồn tại');

      const newProduct = new Product();
      newProduct.productName = productName;
      newProduct.description = description;
      newProduct.category = category;
      newProduct.stock = 0;
      newProduct.status = 'active';

      const savedProduct = await queryRunner.manager.save(newProduct);

      if (productImages && productImages.length > 0) {
        const productImgs = productImages.map((url, index) =>
          queryRunner.manager.create(Image, {
            url,
            ownerType: ImageOwnerType.PRODUCT,
            ownerId: savedProduct.id,
            isPrimary: index === 0, // Ảnh đầu tiên làm ảnh chính
          }),
        );
        await queryRunner.manager.save(productImgs);
      }

      const productAttributesMap = new Map<string, Attribute>();
      let totalStock = 0;

      if (variants && variants.length > 0) {
        for (const variantDto of variants) {
          const variantAttributeValues: AttributeValue[] = [];

          for (const attrData of variantDto.attributeValues) {
            const attrName = attrData.name;
            const valName = attrData.value;

            let attribute = await queryRunner.manager.findOne(Attribute, {
              where: { attributeName: attrName },
            });

            if (!attribute) {
              attribute = queryRunner.manager.create(Attribute, {
                attributeName: attrName,
              });
              attribute = await queryRunner.manager.save(attribute);
            }

            if (!productAttributesMap.has(attrName)) {
              productAttributesMap.set(attrName, attribute);
            }

            let attributeValue = await queryRunner.manager.findOne(
              AttributeValue,
              {
                where: {
                  valueName: valName,
                  attribute: { id: attribute.id },
                },
              },
            );

            if (!attributeValue) {
              attributeValue = queryRunner.manager.create(AttributeValue, {
                valueName: valName,
                attribute: attribute,
              });
              attributeValue = await queryRunner.manager.save(attributeValue);
            }

            variantAttributeValues.push(attributeValue);
          }

          const newVariant = queryRunner.manager.create(Variant, {
            product: savedProduct,
            stock: variantDto.stock,
            attributeValues: variantAttributeValues,
          });

          const savedVariant = await queryRunner.manager.save(newVariant);

          if (variantDto.images && variantDto.images.length > 0) {
            const variantImgs = variantDto.images.map((url, index) =>
              queryRunner.manager.create(Image, {
                url,
                ownerType: ImageOwnerType.VARIANT,
                ownerId: savedVariant.id,
                isPrimary: index === 0,
              }),
            );
            await queryRunner.manager.save(variantImgs);
          }

          const newPrice = queryRunner.manager.create(Price, {
            amount: variantDto.price, // Lấy giá từ DTO
            currency: 'VND',
            priceType: 'original',
            variant: savedVariant,
          });

          await queryRunner.manager.save(newPrice);

          totalStock += variantDto.stock;
        }
      }

      savedProduct.attributes = Array.from(productAttributesMap.values());
      savedProduct.stock = totalStock;

      if (totalStock === 0) {
        savedProduct.status = 'out_of_stock';
      }

      const finalProduct = await queryRunner.manager.save(savedProduct);

      await queryRunner.commitTransaction();

      return {
        message: 'Tạo sản phẩm, biến thể và giá thành công',
        data: finalProduct,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
