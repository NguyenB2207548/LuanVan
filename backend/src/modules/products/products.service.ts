import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { Variant } from './entities/variant.entity';
import { Attribute } from './entities/attribute.entity';
import { AttributeValue } from './entities/attribute_value.entity';
import { Category } from '../categorys/entities/category.entity';
import { Image } from '../images/entities/image.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(private dataSource: DataSource) {}

  // 1. Lấy tất cả sản phẩm (Kèm theo Seller, Ảnh, Biến thể và Thuộc tính)
  async findAll() {
    const productRepository = this.dataSource.getRepository(Product);

    // Nhờ cấu trúc Entity mới, ta chỉ cần 1 câu lệnh find với relations
    return await productRepository.find({
      relations: [
        'category',
        'seller',
        'images', // Ảnh của sản phẩm
        'variants',
        'variants.images', // Ảnh của từng biến thể
        'variants.attributeValues',
        'variants.attributeValues.attribute',
        'attributes',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // 2. Chi tiết sản phẩm
  async findOne(id: number) {
    const productRepository = this.dataSource.getRepository(Product);
    const product = await productRepository.findOne({
      where: { id },
      relations: [
        'category',
        'seller',
        'images',
        'variants',
        'variants.images',
        'variants.attributeValues',
        'variants.attributeValues.attribute',
        'attributes',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID #${id}`);
    }
    return product;
  }

  // 3. Tạo sản phẩm (Có Seller ID từ JWT)
  async create(createProductDto: CreateProductDto, sellerId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { productName, description, categoryId, variants, productImages } =
        createProductDto;

      // Kiểm tra danh mục
      const category = await queryRunner.manager.findOne(Category, {
        where: { id: categoryId },
      });
      if (!category) throw new BadRequestException('Danh mục không tồn tại');

      // Kiểm tra Seller
      const seller = await queryRunner.manager.findOne(User, {
        where: { id: sellerId },
      });
      if (!seller) throw new BadRequestException('Seller không hợp lệ');

      // 1. Khởi tạo Product
      const newProduct = queryRunner.manager.create(Product, {
        productName,
        description,
        category,
        seller,
        status: 'active',
      });

      const savedProduct = await queryRunner.manager.save(newProduct);

      // 2. Lưu ảnh cho Product (Dùng khóa ngoại product_id)
      if (productImages && productImages.length > 0) {
        const productImgs = productImages.map((url, index) =>
          queryRunner.manager.create(Image, {
            url,
            product: savedProduct,
            isPrimary: index === 0,
          }),
        );
        await queryRunner.manager.save(productImgs);
      }

      const productAttributesMap = new Map<string, Attribute>();

      // 3. Xử lý Variants
      if (variants && variants.length > 0) {
        for (const variantDto of variants) {
          const variantAttributeValues: AttributeValue[] = [];

          for (const attrData of variantDto.attributeValues) {
            // Xử lý Attribute (Màu sắc, Kích thước...)
            let attribute = await queryRunner.manager.findOne(Attribute, {
              where: { attributeName: attrData.name },
            });

            if (!attribute) {
              attribute = await queryRunner.manager.save(
                queryRunner.manager.create(Attribute, {
                  attributeName: attrData.name,
                }),
              );
            }
            productAttributesMap.set(attrData.name, attribute);

            // Xử lý Attribute Value (Đỏ, Xanh, XL...)
            let attributeValue = await queryRunner.manager.findOne(
              AttributeValue,
              {
                where: {
                  valueName: attrData.value,
                  attribute: { id: attribute.id },
                },
              },
            );

            if (!attributeValue) {
              attributeValue = await queryRunner.manager.save(
                queryRunner.manager.create(AttributeValue, {
                  valueName: attrData.value,
                  attribute: attribute,
                }),
              );
            }
            variantAttributeValues.push(attributeValue);
          }

          // Tạo Variant (Giá và kho hàng nằm trực tiếp ở đây)
          const newVariant = queryRunner.manager.create(Variant, {
            product: savedProduct,
            stock: variantDto.stock,
            price: variantDto.price, // Hợp nhất giá trực tiếp
            attributeValues: variantAttributeValues,
          });

          const savedVariant = await queryRunner.manager.save(newVariant);

          // Lưu ảnh cho Variant (Dùng khóa ngoại variant_id)
          if (variantDto.images && variantDto.images.length > 0) {
            const variantImgs = variantDto.images.map((url, index) =>
              queryRunner.manager.create(Image, {
                url,
                variant: savedVariant,
                isPrimary: index === 0,
              }),
            );
            await queryRunner.manager.save(variantImgs);
          }
        }
      }

      // Cập nhật quan hệ Attributes cho Product
      savedProduct.attributes = Array.from(productAttributesMap.values());
      await queryRunner.manager.save(savedProduct);

      await queryRunner.commitTransaction();
      return { message: 'Tạo sản phẩm thành công', data: savedProduct };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const productRepository = this.dataSource.getRepository(Product);
    const product = await productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm #${id}`);

    // Nhờ CASCADE ở Entity, các Variant và Image liên quan sẽ tự bị xóa
    await productRepository.remove(product);
    return { message: `Đã xóa sản phẩm #${id}` };
  }
}
