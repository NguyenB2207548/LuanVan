import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { Variant } from '../variants/entities/variant.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { AttributeValue } from '../attribute_values/entities/attribute_value.entity';
import { Category } from '../categorys/entities/category.entity';

@Injectable()
export class ProductsService {
  constructor(private dataSource: DataSource) {}

  async findAll() {
    const productRepository = this.dataSource.getRepository(Product);
    return productRepository.find({
      relations: ['category', 'variants', 'attributes'],
    });
  }

  async create(createProductDto: CreateProductDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { productName, description, categoryId, variants } =
        createProductDto;

      // 1. Tìm Category
      const category = await queryRunner.manager.findOne(Category, {
        where: { id: categoryId },
      });
      if (!category) throw new BadRequestException('Category not found');

      // 2. Tạo Product (Lưu trước để có ID)
      const newProduct = new Product();
      newProduct.productName = productName;
      newProduct.description = description;
      newProduct.category = category;
      newProduct.stock = 0; // Sẽ cộng dồn từ variant
      newProduct.status = 'active';

      const savedProduct = await queryRunner.manager.save(newProduct);

      // Map để lưu các Attribute duy nhất của sản phẩm này (để link vào bảng product_attributes)
      const productAttributesMap = new Map<string, Attribute>();
      let totalStock = 0;

      // 3. Duyệt qua từng Variant đầu vào
      for (const variantDto of variants) {
        const variantAttributeValues: AttributeValue[] = [];

        // Xử lý từng thuộc tính trong variant (vd: Màu sắc - Đỏ)
        for (const attrDto of variantDto.attributes) {
          const attrName = attrDto.attributeName;
          const valName = attrDto.value.valueName;

          // A. Xử lý Attribute (Cha)
          let attribute = await queryRunner.manager.findOne(Attribute, {
            where: { attributeName: attrName },
          });

          if (!attribute) {
            attribute = queryRunner.manager.create(Attribute, {
              attributeName: attrName,
            });
            attribute = await queryRunner.manager.save(attribute);
          }

          // Lưu vào Map để lát update cho Product
          if (!productAttributesMap.has(attrName)) {
            productAttributesMap.set(attrName, attribute);
          }

          // B. Xử lý AttributeValue (Con)
          // Phải tìm value thuộc đúng attribute id đó
          let attributeValue = await queryRunner.manager.findOne(
            AttributeValue,
            {
              where: {
                valueName: valName,
                attribute: { id: attribute.id },
              },
              relations: ['attribute'],
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

        // C. Tạo Variant và link với các AttributeValue vừa tìm/tạo được
        const newVariant = queryRunner.manager.create(Variant, {
          product: savedProduct,
          stock: variantDto.stock,
          attributeValues: variantAttributeValues, // TypeORM tự động xử lý bảng trung gian variant_attribute_values
        });
        await queryRunner.manager.save(newVariant);

        totalStock += variantDto.stock;
      }

      // 4. Update lại Product
      // Link bảng product_attributes
      savedProduct.attributes = Array.from(productAttributesMap.values());
      // Cập nhật tổng tồn kho
      savedProduct.stock = totalStock;

      if (totalStock === 0) savedProduct.status = 'out_of_stock';

      await queryRunner.manager.save(savedProduct);

      await queryRunner.commitTransaction();

      return {
        message: 'Product created successfully',
        data: savedProduct,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
