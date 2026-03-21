import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, DataSource, In, IsNull, Not, Raw } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { Variant } from './entities/variant.entity';
import { Attribute } from './entities/attribute.entity';
import { AttributeValue } from './entities/attribute_value.entity';
import { Category } from '../categorys/entities/category.entity';
import { Image } from '../images/entities/image.entity';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ProductSearchDto } from './dto/search-product.dto';
import { Design } from '../designs/entities/design.entity';

@Injectable()
export class ProductsService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) { }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.productRepository.findAndCount({
      relations: [
        'categories',
        'seller',
        'images',
        'variants',
        'variants.attributeValues',
        'variants.attributeValues.attribute',
      ],

      select: {
        id: true,
        productName: true,
        status: true,
        createdAt: true,
        seller: {
          id: true,
          fullName: true,
        },
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data: items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'categories',
        'seller',
        'images',
        'attributes',
        'mockup',
        'mockup.printArea',

        'variants',
        'variants.images',
        'variants.attributeValues',
        'variants.attributeValues.attribute',

        'variants',
        'variants.mockup.printArea',

        'design',

        'design.artwork',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm #${id}`);
    }

    return product;
  }

  // API cho gộp design
  async findAllForDesigner(sellerId: number) {
    return await this.productRepository
      .createQueryBuilder('product')

      .select(['product.id', 'product.name', 'product.description'])

      .leftJoinAndSelect('product.mockup', 'productMockup')
      .leftJoinAndSelect('productMockup.printAreas', 'productPrintArea')

      .leftJoinAndSelect('product.variants', 'variant')

      .leftJoinAndSelect('variant.attributeValues', 'attributeValue')
      .leftJoinAndSelect('attributeValue.attribute', 'attribute')

      .leftJoinAndSelect('variant.mockup', 'variantMockup')
      .leftJoinAndSelect('variantMockup.printAreas', 'variantPrintArea')

      .where('product.sellerId = :sellerId', { sellerId })
      .getMany();
  }

  async findAllBySeller(
    sellerId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.productRepository.findAndCount({
      where: {
        seller: { id: sellerId },
      },
      relations: [
        'categories',
        'images',
        'mockup',
        'mockup.printArea',
        'variants',
        'variants.attributeValues',
        'variants.attributeValues.attribute',
        'variants.mockup',
        'variants.mockup.printArea',
      ],
      select: {
        id: true,
        productName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // Phải thêm các dòng này:
        categories: true,
        images: true,
        mockup: true,
        variants: true,
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data: items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy 5 sản phẩm mới nhất
   */
  async getLatestProducts() {
    return await this.dataSource.getRepository(Product).find({
      relations: ['images', 'variants'],
      where: {
        images: { isPrimary: true },
      },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  /**
   * Lấy 5 sản phẩm thịnh hành (Bán chạy nhất)
   */
  async getTrendingProducts() {
    return await this.dataSource.manager
      .createQueryBuilder(Product, 'product')
      .leftJoinAndSelect(
        'product.images',
        'image',
        'image.isPrimary = :isPrimary',
        { isPrimary: true },
      )
      .leftJoinAndSelect('product.variants', 'variant')
      // Join với OrderItem để đếm số lượng bán
      .leftJoin('variant.orderItems', 'orderItem')
      .select([
        'product.id',
        'product.productName',
        'product.description',
        'image.url',
      ])
      // Tính tổng số lượng bán ra
      .addSelect('SUM(COALESCE(orderItem.quantity, 0))', 'totalSold')
      .groupBy('product.id')
      .addGroupBy('image.id')
      .orderBy('totalSold', 'DESC')
      .limit(5)
      .getMany();
  }

  async searchProducts(query: ProductSearchDto) {
    const {
      keyword,
      categoryId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.dataSource
      .getRepository(Product)
      .createQueryBuilder('product')
      .leftJoinAndSelect(
        'product.images',
        'image',
        'image.isPrimary = :isPrimary',
        { isPrimary: true },
      )
      .leftJoinAndSelect('product.categories', 'category')
      .leftJoinAndSelect('product.variants', 'variant');

    // 1. Tìm kiếm theo tên (Keyword)
    if (keyword) {
      queryBuilder.andWhere('product.productName LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    // 2. Lọc theo danh mục
    if (categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    }

    // 3. Lọc theo khoảng giá (Dựa trên giá của các biến thể)
    if (minPrice !== undefined) {
      queryBuilder.andWhere('variant.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('variant.price <= :maxPrice', { maxPrice });
    }

    // 4. Phân trang & Trả về kết quả
    queryBuilder.orderBy('product.createdAt', 'DESC').skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async getRelatedProducts(
    productId: number,
    categoryId: number,
    limit: number = 4,
  ) {
    return await this.dataSource.getRepository(Product).find({
      where: {
        categories: { id: categoryId },
        id: Not(productId),
      },
      relations: ['images', 'variants'],
      // Chỉ lấy ảnh chính để hiển thị slider
      join: {
        alias: 'product',
        leftJoinAndSelect: {
          images: 'product.images',
        },
      },
      // Filter ảnh chính ở tầng ứng dụng hoặc dùng QueryBuilder để tối ưu hơn
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }
  // CREATE PRODUCT
  async create(createProductDto: CreateProductDto, sellerId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { productName, description, categoryId, variants, productImages } =
        createProductDto;

      // 1. Kiểm tra category và seller
      const category = await queryRunner.manager.findOne(Category, {
        where: { id: categoryId },
      });
      const seller = await queryRunner.manager.findOne(User, {
        where: { id: sellerId },
      });

      if (!category) throw new BadRequestException('Danh mục không tồn tại');
      if (!seller) throw new BadRequestException('Seller không hợp lệ');

      // 2. Tạo Product
      const newProduct = queryRunner.manager.create(Product, {
        productName,
        description,
        categories: [category],
        seller,
      });
      const savedProduct = await queryRunner.manager.save(newProduct);

      // 3. Xử lý ảnh sản phẩm
      if (productImages?.length) {
        const productImgs = productImages.map((url, i) =>
          queryRunner.manager.create(Image, {
            url,
            product: savedProduct,
            isPrimary: i === 0,
          }),
        );
        await queryRunner.manager.save(productImgs);
      }

      const productAttributesMap = new Map<string, Attribute>();
      const savedVariantsResult: Variant[] = [];

      // 4. Xử lý Variants
      if (variants?.length) {
        for (const variantDto of variants) {
          const variantAttributeValues = await queryRunner.manager.find(
            AttributeValue,
            {
              where: { id: In(variantDto.attributeValueIds) },
              relations: ['attribute'],
            },
          );

          if (
            variantAttributeValues.length !==
            variantDto.attributeValueIds.length
          ) {
            throw new BadRequestException(
              'Một hoặc nhiều giá trị thuộc tính không tồn tại',
            );
          }

          variantAttributeValues.forEach((av) => {
            productAttributesMap.set(av.attribute.attributeName, av.attribute);
          });

          const newVariant = queryRunner.manager.create(Variant, {
            product: savedProduct,
            stock: variantDto.stock,
            price: variantDto.price,
            sku:
              variantDto.sku ||
              `${savedProduct.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            attributeValues: variantAttributeValues,
          });

          const savedVariant = await queryRunner.manager.save(newVariant);

          // Đưa variant đã lưu vào mảng kết quả
          savedVariantsResult.push(savedVariant);

          if (variantDto.images?.length) {
            const variantImgs = variantDto.images.map((url, i) =>
              queryRunner.manager.create(Image, {
                url,
                variant: savedVariant,
                isPrimary: i === 0,
              }),
            );
            await queryRunner.manager.save(variantImgs);
          }
        }
      }

      // 5. Cập nhật Attribute cho Product
      savedProduct.attributes = Array.from(productAttributesMap.values());
      await queryRunner.manager.save(savedProduct);

      await queryRunner.commitTransaction();

      // 6. TRẢ VỀ ĐẦY ĐỦ DỮ LIỆU ĐỂ FRONTEND KHÔNG BỊ LỖI
      return {
        message: 'Tạo sản phẩm thành công',
        id: savedProduct.id,
        variants: savedVariantsResult, // Trả về mảng variants có chứa ID
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm #${id}`);
    }

    await this.productRepository.softRemove(product);

    return { message: `Sản phẩm #${id} đã được chuyển vào thùng rác.` };
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    sellerId: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id, seller: { id: sellerId } },
        relations: [
          'variants',
          'images',
          'categories',
          'attributes',
          'variants.attributeValues',
          'variants.attributeValues.attribute',
        ],
      });

      if (!product)
        throw new NotFoundException(`Sản phẩm #${id} không tồn tại hoặc bạn không có quyền sửa`);

      const { productName, description, categoryId, variants, productImages } = updateProductDto;

      if (productName) product.productName = productName;
      if (description !== undefined) product.description = description;

      if (categoryId) {
        const category = await queryRunner.manager.findOne(Category, { where: { id: categoryId } });
        if (category) product.categories = [category];
      }

      // 4. XỬ LÝ ẢNH SẢN PHẨM CHÍNH
      if (productImages !== undefined) {
        await queryRunner.manager.delete(Image, {
          product: { id: product.id },
          variant: IsNull(),
        });

        if (productImages.length > 0) {
          const newImgs = productImages.map((url, index) =>
            queryRunner.manager.create(Image, {
              url,
              product: product,
              isPrimary: index === 0,
            }),
          );
          // Gán ngược lại để tránh bị null khi save product ở cuối
          product.images = await queryRunner.manager.save(Image, newImgs);
        } else {
          product.images = [];
        }
      }

      // 5. Xử lý Variants
      const currentAttributeIds = new Set<number>();
      const updatedVariantsResult: Variant[] = [];

      if (variants) {
        const incomingVariantIds = variants.filter((v) => v.id).map((v) => v.id as number);
        const variantsToDelete = product.variants.filter((ov) => !incomingVariantIds.includes(ov.id));

        if (variantsToDelete.length > 0) {
          await queryRunner.manager.delete(Image, {
            variantId: In(variantsToDelete.map((v) => v.id)),
          });
          await queryRunner.manager.softRemove(variantsToDelete);
        }

        for (const vDto of variants) {
          const variantAttrValues = await queryRunner.manager.find(AttributeValue, {
            where: { id: In(vDto.attributeValueIds) },
            relations: ['attribute'],
          });

          variantAttrValues.forEach((av) => currentAttributeIds.add(av.attribute.id));

          let variant: Variant;
          if (vDto.id) {
            const preloadedVariant = await queryRunner.manager.preload(Variant, {
              id: vDto.id,
              stock: Number(vDto.stock),
              price: Number(vDto.price),
              sku: vDto.sku,
              attributeValues: variantAttrValues,
            });
            if (!preloadedVariant) throw new NotFoundException(`Biến thể #${vDto.id} không tồn tại`);
            variant = preloadedVariant as Variant;
          } else {
            variant = queryRunner.manager.create(Variant, {
              product: product,
              stock: Number(vDto.stock),
              price: Number(vDto.price),
              sku: vDto.sku || `SKU-${id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              attributeValues: variantAttrValues,
            });
          }

          const savedVariant = await queryRunner.manager.save(Variant, variant);

          // Xử lý ảnh cho Variant
          if (vDto.images) {
            await queryRunner.manager.delete(Image, { variantId: savedVariant.id });
            if (vDto.images.length > 0) {
              const vImgs = vDto.images.map((url, i) =>
                queryRunner.manager.create(Image, {
                  url,
                  variant: savedVariant,
                  productId: product.id,
                  isPrimary: i === 0,
                }),
              );
              await queryRunner.manager.save(Image, vImgs);
            }
          }
          updatedVariantsResult.push(savedVariant);
        }

        // QUAN TRỌNG: Cập nhật lại mảng variants của object product 
        // để lệnh save cuối cùng không set product_id = null
        product.variants = updatedVariantsResult;
      }

      // 6. Cập nhật mảng Attributes tổng hợp
      if (currentAttributeIds.size > 0) {
        const productAttributes = await queryRunner.manager.find(Attribute, {
          where: { id: In(Array.from(currentAttributeIds)) },
        });
        product.attributes = productAttributes;
      } else {
        product.attributes = [];
      }

      // Lệnh save này sẽ lưu cả Product, Attributes và giữ nguyên liên kết Variants/Images
      await queryRunner.manager.save(Product, product);

      await queryRunner.commitTransaction();
      return {
        message: 'Cập nhật sản phẩm thành công',
        id: product.id,
        variants: updatedVariantsResult,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
