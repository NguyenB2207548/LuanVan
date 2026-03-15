import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, DataSource, In, IsNull, Not } from 'typeorm';
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
  ) {}

  async getPodDesignByProductId(productId: number) {
    // 1. Kiểm tra sản phẩm có tồn tại không
    const product = await this.dataSource.getRepository(Product).findOne({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    // 2. Lấy Design cùng các quan hệ liên quan
    const designData = await this.dataSource.getRepository(Design).findOne({
      where: { product: { id: productId } },
      relations: [
        'artworks', // Các layer JSON mặc định
        'product',
        'product.variants', // Lấy variants để map với mockups
        'product.variants.mockup', // Lấy phôi ảnh
        'product.variants.mockup.printArea', // Lấy tọa độ vùng in
      ],
      order: {
        artworks: { order: 'ASC' }, // Sắp xếp layer theo thứ tự hiển thị
      },
    });

    if (!designData) {
      throw new NotFoundException(
        'Sản phẩm này chưa được cấu hình thiết kế POD',
      );
    }

    // 3. Chuẩn hóa dữ liệu trả về cho Frontend
    return {
      designId: designData.id,
      productName: designData.product.productName,
      // Danh sách các layer mặc định để vẽ lên Canvas
      defaultArtworks: designData.artworks.map((art) => ({
        id: art.id,
        layers: JSON.parse(art.layersJson), // Parse string thành Object JSON
        order: art.order,
      })),
      // Danh sách các tùy chọn phôi (Mockups) cho từng Variant
      variantsMockups: designData.product.variants.map((variant) => ({
        variantId: variant.id,
        sku: variant.sku,
        price: variant.price,
        mockup: variant.mockup
          ? {
              url: variant.mockup.url,
              printArea: variant.mockup.printArea
                ? {
                    x: variant.mockup.printArea.x,
                    y: variant.mockup.printArea.y,
                    width: variant.mockup.printArea.width,
                    height: variant.mockup.printArea.height,
                    // Thông số thực tế để tính toán file in sau này
                    realWidthInch: variant.mockup.printArea.realWidthInch,
                    realHeightInch: variant.mockup.printArea.realHeightInch,
                    targetDpi: variant.mockup.printArea.targetDpi,
                  }
                : null,
            }
          : null,
      })),
    };
  }

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
        'variants',
        'variants.images',
        'variants.attributeValues',
        'variants.attributeValues.attribute',
        'attributes',
      ],
    });

    if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm #${id}`);
    return product;
  }

  async findAllBySeller(
    sellerId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.productRepository.findAndCount({
      where: {
        seller: { id: sellerId }, // Lọc chính xác theo ID của người bán
      },
      relations: [
        'categories',
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
        updatedAt: true,
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
   * Lấy 10 sản phẩm mới nhất
   */
  async getLatestProducts() {
    return await this.dataSource.getRepository(Product).find({
      relations: ['images', 'variants'],
      where: {
        images: { isPrimary: true },
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  /**
   * Lấy 10 sản phẩm thịnh hành (Bán chạy nhất)
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
      .limit(10)
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

  async create(createProductDto: CreateProductDto, sellerId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { productName, description, categoryId, variants, productImages } =
        createProductDto;

      // Kiểm tra category và seller
      const category = await queryRunner.manager.findOne(Category, {
        where: { id: categoryId },
      });
      const seller = await queryRunner.manager.findOne(User, {
        where: { id: sellerId },
      });

      if (!category) throw new BadRequestException('Danh mục không tồn tại');
      if (!seller) throw new BadRequestException('Seller không hợp lệ');

      const newProduct = queryRunner.manager.create(Product, {
        productName,
        description,
        categories: [category],
        seller,
      });
      const savedProduct = await queryRunner.manager.save(newProduct);

      // ảnh sản phẩm
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

      if (variants?.length) {
        for (const variantDto of variants) {
          // Tìm các AttributeValue object dựa trên mảng ID gửi lên
          const variantAttributeValues = await queryRunner.manager.find(
            AttributeValue,
            {
              where: { id: In(variantDto.attributeValueIds) },
              relations: ['attribute'], // Lấy luôn attribute cha để thống kê
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

          // Lưu các attribute vào map để cập nhật cho Product sau này
          variantAttributeValues.forEach((av) => {
            productAttributesMap.set(av.attribute.attributeName, av.attribute);
          });

          // Tạo Variant
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

          // Lưu ảnh cho Variant
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

      savedProduct.attributes = Array.from(productAttributesMap.values());
      await queryRunner.manager.save(savedProduct);

      await queryRunner.commitTransaction();
      return { message: 'Tạo sản phẩm thành công', id: savedProduct.id };
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

  async update(id: number, updateProductDto: UpdateProductDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id },
        relations: ['variants', 'images', 'categories'],
      });

      if (!product)
        throw new NotFoundException(`Sản phẩm #${id} không tồn tại`);

      const { productName, description, categoryId, variants, productImages } =
        updateProductDto;

      // 1. Cập nhật thông tin cơ bản
      if (productName) product.productName = productName;
      if (description) product.description = description;

      // 2. Cập nhật Category
      if (categoryId) {
        const category = await queryRunner.manager.findOne(Category, {
          where: { id: categoryId },
        });
        if (!category) throw new BadRequestException('Danh mục không tồn tại');
        product.categories = [category];
      }

      // 3. Cập nhật Ảnh chung của Sản phẩm (Product Images)
      if (productImages) {
        // Chỉ xóa những ảnh là ảnh của Product (variant_id IS NULL)
        await queryRunner.manager.delete(Image, {
          product: { id: product.id },
          variant: IsNull(),
        });

        const newImages = productImages.map((url, i) =>
          queryRunner.manager.create(Image, {
            url,
            product,
            isPrimary: i === 0, // Ảnh đầu tiên là ảnh chính sản phẩm
          }),
        );
        await queryRunner.manager.save(Image, newImages);
      }

      // 4. Cập nhật Biến thể (Variants)
      if (variants) {
        // BƯỚC QUAN TRỌNG: Dọn dẹp ảnh của các Variant cũ trước khi xóa variant
        const oldVariantIds = product.variants.map((v) => v.id);
        if (oldVariantIds.length > 0) {
          await queryRunner.manager.delete(Image, {
            variant: { id: In(oldVariantIds) },
          });
        }

        // Xóa mềm các variant cũ
        await queryRunner.manager.softRemove(product.variants);

        for (const vDto of variants) {
          const variantDto = vDto as unknown as CreateVariantDto;

          const variantAttrValues = await queryRunner.manager.find(
            AttributeValue,
            {
              where: { id: In(variantDto.attributeValueIds) },
            },
          );

          if (
            variantAttrValues.length !== variantDto.attributeValueIds.length
          ) {
            throw new BadRequestException(
              'Một số giá trị thuộc tính không tồn tại',
            );
          }

          // Tạo Variant mới
          const newVariant = queryRunner.manager.create(Variant, {
            product: product,
            stock: variantDto.stock,
            price: variantDto.price,
            sku:
              variantDto.sku ||
              `${product.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            attributeValues: variantAttrValues,
          });

          const savedVariant = await queryRunner.manager.save(
            Variant,
            newVariant,
          );

          // LƯU ẢNH CHO VARIANT MỚI (Phần này code cũ của bạn bị thiếu)
          if (variantDto.images && variantDto.images.length > 0) {
            const variantImgs = variantDto.images.map((url, i) =>
              queryRunner.manager.create(Image, {
                url,
                variant: savedVariant,
                isPrimary: i === 0, // Ảnh đầu tiên của mỗi variant là ảnh chính variant đó
              }),
            );
            await queryRunner.manager.save(Image, variantImgs);
          }
        }
      }

      await queryRunner.manager.save(Product, product);
      await queryRunner.commitTransaction();
      return { message: 'Cập nhật sản phẩm thành công' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
