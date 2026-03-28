import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Design } from './entities/design.entity';
import { Artwork } from './entities/artwork.entity';
import { Mockup } from './entities/mockup.entity';
import { PrintArea } from './entities/print_area.entity';
import { Product } from '../products/entities/product.entity';
import { Variant } from '../products/entities/variant.entity';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateMockupDto } from './dto/update-mockup.dto';
import { CreatePrintAreaDto } from './dto/create-print-area.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { UpdateArtworkDto } from './dto/update-artwork.dto';

@Injectable()
export class DesignService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Variant) private variantRepo: Repository<Variant>,
    @InjectRepository(Design) private designRepo: Repository<Design>,
    @InjectRepository(Artwork) private artworkRepo: Repository<Artwork>, // thêm dòng này
  ) { }

  // ======================= MOCKUP =========================
  async updateVariantMockup(
    sellerId: number,
    variantId: number,
    dto: UpdateMockupDto,
  ) {
    const variant = await this.variantRepo.findOne({
      where: { id: variantId, product: { seller: { id: sellerId } } },
      relations: ['mockup', 'mockup.printArea'],
    });

    if (!variant)
      throw new ForbiddenException(
        'Biến thể không hợp lệ hoặc không thuộc shop của bạn',
      );

    return await this.dataSource.transaction(async (manager) => {
      let mockup = variant.mockup;
      if (!mockup) {
        mockup = manager.create(Mockup, { variant });
      }
      mockup.url = dto.url ?? mockup.url ?? '';
      const savedMockup = await manager.save(mockup);

      let printArea = savedMockup.printArea;
      if (!printArea) {
        printArea = manager.create(PrintArea, { mockup: savedMockup });
      }
      printArea.x = dto.x ?? 0;
      printArea.y = dto.y ?? 0;
      printArea.width = dto.width ?? 0;
      printArea.height = dto.height ?? 0;
      printArea.realWidthInch = dto.realWidthInch ?? 0;
      printArea.realHeightInch = dto.realHeightInch ?? 0;

      await manager.save(printArea);
      return { message: 'Cập nhật Mockup và Vùng in thành công' };
    });
  }

  async addMockupToVariant(sellerId: number, variantId: number, dto: any) {
    return await this.dataSource.transaction(async (manager) => {
      const variant = await manager.findOne(Variant, {
        where: { id: variantId, product: { seller: { id: sellerId } } },
        relations: ['mockup', 'mockup.printArea'],
      });

      if (!variant)
        throw new ForbiddenException(
          'Bạn không có quyền chỉnh sửa biến thể này',
        );

      let mockup = variant.mockup;
      if (!mockup) {
        mockup = manager.create(Mockup, { variant });
      }

      if (dto.url) {
        mockup.url = dto.url;
      }

      const savedMockup = await manager.save(mockup);

      let printArea = savedMockup.printArea;
      if (!printArea) {
        printArea = manager.create(PrintArea, { mockup: savedMockup });
      }

      printArea.x = dto.x ?? 0;
      printArea.y = dto.y ?? 0;
      printArea.width = dto.width ?? 0;
      printArea.height = dto.height ?? 0;
      printArea.realWidthInch = dto.realWidthInch ?? 0;
      printArea.realHeightInch = dto.realHeightInch ?? 0;

      await manager.save(printArea);

      return { message: 'Thành công', mockupId: savedMockup.id };
    });
  }
  async addMockupToProduct(
    sellerId: number,
    productId: number,
    dto: UpdateMockupDto,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: productId, seller: { id: sellerId } },
        relations: ['mockup', 'mockup.printArea'],
      });

      if (!product) throw new ForbiddenException('Sản phẩm không thuộc về bạn');

      let mockup = product.mockup;
      if (!mockup) {
        mockup = manager.create(Mockup, { product });
      }

      // SỬ DỤNG URL TỪ ASSET MANAGER
      mockup.url = dto.url ?? mockup.url ?? '';
      const savedMockup = await manager.save(mockup);

      let printArea = savedMockup.printArea;
      if (!printArea) {
        printArea = manager.create(PrintArea, { mockup: savedMockup });
      }

      // Gán các thông số tọa độ mặc định là 0 nếu không có
      printArea.x = dto.x ?? 0;
      printArea.y = dto.y ?? 0;
      printArea.width = dto.width ?? 0;
      printArea.height = dto.height ?? 0;
      printArea.realWidthInch = dto.realWidthInch ?? 0;
      printArea.realHeightInch = dto.realHeightInch ?? 0;

      await manager.save(printArea);
      return { message: 'Thành công', mockupId: savedMockup.id };
    });
  }

  // ======================= PRINT AREA =========================

  async addPrintArea(
    sellerId: number,
    mockupId: number,
    dto: CreatePrintAreaDto,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const mockup = await manager.findOne(Mockup, {
        where: [
          { id: mockupId, variant: { product: { seller: { id: sellerId } } } },
          { id: mockupId, product: { seller: { id: sellerId } } },
        ],
        relations: ['printArea'],
      });

      if (!mockup) {
        throw new ForbiddenException(
          'Mockup không tồn tại hoặc bạn không có quyền chỉnh sửa',
        );
      }

      let printArea = mockup.printArea;

      if (!printArea) {
        printArea = manager.create(PrintArea, {
          mockup: mockup,
        });
      }

      printArea.x = dto.x;
      printArea.y = dto.y;
      printArea.width = dto.width;
      printArea.height = dto.height;
      printArea.realWidthInch = dto.realWidthInch;
      printArea.realHeightInch = dto.realHeightInch;
      printArea.targetDpi = dto.targetDpi || 300;

      const savedPrintArea = await manager.save(PrintArea, printArea);

      return {
        message: 'Cấu hình vùng in thành công',
        data: savedPrintArea,
      };
    });
  }

  // ======================= ARTWORK =========================

  async getSellerArtworks(sellerId: number) {
    return await this.artworkRepo.find({
      where: {
        seller: { id: sellerId },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async createArtwork(sellerId: number, dto: CreateArtworkDto) {
    const artwork = this.artworkRepo.create({
      artworkName: dto.artworkName,
      layersJson: dto.layersJson,
      seller: { id: sellerId } as User,
    });

    try {
      const savedArtwork = await this.artworkRepo.save(artwork);
      return savedArtwork;
    } catch (error) {
      throw new InternalServerErrorException('Không thể lưu artwork');
    }
  }

  async getArtworkById(id: number, sellerId: number) {
    // 1. Tìm Artwork và kiểm tra quyền sở hữu qua seller_id
    // Sử dụng relations để lấy luôn thông tin Mockup và PrintArea nếu cần hiển thị trên Canvas
    const artwork = await this.artworkRepo.findOne({
      where: {
        id: id,
        seller: { id: sellerId } // Khớp với @JoinColumn({ name: 'seller_id' })
      },
      // Nếu thiết kế của ông yêu cầu load cả Mockup/PrintArea từ bảng khác:
      // relations: ['designs', 'designs.product', 'designs.product.mockup', 'designs.product.mockup.printArea']
    });

    if (!artwork) {
      throw new NotFoundException(
        `Không tìm thấy Artwork ID ${id} hoặc bạn không có quyền chỉnh sửa thiết kế này.`
      );
    }

    // 2. Format lại dữ liệu trả về cho Frontend
    // Vì layersJson trong Entity Artwork của ông là kiểu 'json', 
    // TypeORM sẽ tự động parse thành Object/Array, không cần JSON.parse nữa.

    return {
      id: artwork.id,
      artworkName: artwork.artworkName,
      layers: artwork.layersJson?.details || [], // Lấy mảng layers từ object chi tiết
      mockupUrl: artwork.layersJson?.mockup || '', // URL ảnh nền mockup
      printArea: artwork.layersJson?.printArea || {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        visible: false
      },
      updatedAt: artwork.updatedAt
    };
  }

  async updateArtwork(id: number, sellerId: number, updateDto: UpdateArtworkDto) {
    const artwork = await this.artworkRepo.findOne({
      where: {
        id: id,
        seller: { id: sellerId }
      },
    });

    if (!artwork) {
      throw new NotFoundException(`Không tìm thấy Artwork ID ${id} hoặc bạn không có quyền sửa.`);
    }

    if (updateDto.artworkName) {
      artwork.artworkName = updateDto.artworkName;
    }

    if (updateDto.layersJson) {
      artwork.layersJson = updateDto.layersJson;
    }

    const updatedArtwork = await this.artworkRepo.save(artwork);

    return {
      message: 'Cập nhật thiết kế thành công',
      id: updatedArtwork.id,
      artworkName: updatedArtwork.artworkName
    };
  }

  async getSellerArtworkStats(sellerId: number) {
    const [total, usedInDesign] = await Promise.all([
      this.artworkRepo.createQueryBuilder('artwork')
        .where('artwork.seller = :sellerId', { sellerId })
        .getCount(),

      this.artworkRepo.createQueryBuilder('artwork')
        .innerJoin('artwork.designs', 'design')
        .where('artwork.seller = :sellerId', { sellerId })
        .distinct(true)
        .getCount(),
    ]);


    const unused = total - usedInDesign;

    return {
      total,
      usedInDesign,
      unused,
    };
  }

  // ======================= DESIGN =========================

  async createDesign(sellerId: number, dto: CreateDesignDto) {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, seller: { id: sellerId } },
      select: { id: true },
    });

    const artwork = await this.artworkRepo.findOne({
      where: { id: dto.artworkId, seller: { id: sellerId } },
      select: { id: true },
    });

    if (!product)
      throw new ForbiddenException('Sản phẩm không thuộc quyền sở hữu của bạn');

    if (!artwork)
      throw new ForbiddenException('Bản vẽ không thuộc quyền sở hữu của bạn');

    return await this.dataSource.transaction(async (manager) => {
      const design = manager.create(Design, {
        designName: dto.designName,
        product: product,
        artwork: artwork,
      });
      const savedDesign = await manager.save(design);

      return savedDesign;
    });
  }

  async getDesignsBySeller(sellerId: number) {
    return await this.dataSource.getRepository(Design).find({
      where: {
        product: {
          seller: { id: sellerId }, // Lọc tất cả thiết kế thuộc về Product của Seller này
        },
      },
      relations: [
        'artwork', // Quan hệ N-1 với Artwork gốc (nếu bạn đã đổi tên thành artwork)
        'product', // Thông tin sản phẩm phôi
        'product.images', // Ảnh gallery của sản phẩm
        'product.variants', // Các biến thể
        'product.variants.mockup',
        'product.variants.mockup.printArea',
      ],
      order: {
        id: 'DESC', // Hiện cái mới nhất lên đầu
      },
    });
  }

  async adminGetAllDesigns(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Truy vấn danh sách Design kèm thông tin Seller và Product
    const [designs, total] = await this.dataSource
      .getRepository(Design)
      .findAndCount({
        relations: [
          'product',
          'product.seller',
          'product.variants',
          'product.variants.mockup',
        ],
        order: { createdAt: 'DESC' },
        skip: skip,
        take: limit,
      });

    // Chuyển đổi dữ liệu để Admin dễ theo dõi
    const data = designs.map((design) => {
      const totalVariants = design.product.variants.length;
      const configuredMockups = design.product.variants.filter(
        (v) => v.mockup,
      ).length;

      return {
        id: design.id,
        designName: design.designName,
        createdAt: design.createdAt,
        seller: {
          id: design.product.seller?.id,
          name: design.product.seller?.fullName,
          //   shopName: design.product.seller?.shopName, // Nếu bạn có trường này
        },
        product: {
          id: design.product.id,
          name: design.product.productName,
        },
        stats: {
          totalVariants,
          configuredMockups,
          isCompleted: totalVariants === configuredMockups && totalVariants > 0,
        },
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async deleteDesign(id: number, sellerId: number) {
    const design = await this.designRepo.findOne({
      where: {
        id: id,
      },
      relations: ['product', 'product.seller'],
    });

    if (!design) {
      throw new NotFoundException(
        `Không tìm thấy thiết kế với ID ${id} hoặc bạn không có quyền xóa.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(Design, id);
      await queryRunner.commitTransaction();
      return { message: 'Xóa thiết kế thành công' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Có lỗi xảy ra khi xóa thiết kế.');
    } finally {
      await queryRunner.release();
    }
  }

  async getSellerDesignStats(sellerId: number) {
    const [total, linkedToArtwork, attachedToProduct] = await Promise.all([
      // 1. Tổng số bản ghi Design của seller (thông qua product)
      this.designRepo.createQueryBuilder('design')
        .innerJoin('design.product', 'product')
        .where('product.seller = :sellerId', { sellerId })
        .getCount(),

      // 2. Số Design có gắn Artwork (đã được thiết kế)
      this.designRepo.createQueryBuilder('design')
        .innerJoin('design.product', 'product')
        .where('product.seller = :sellerId', { sellerId })
        .andWhere('design.artwork IS NOT NULL')
        .getCount(),

      // 3. Đếm số sản phẩm độc nhất đã có thiết kế
      this.designRepo.createQueryBuilder('design')
        .innerJoin('design.product', 'product')
        .where('product.seller = :sellerId', { sellerId })
        .select('DISTINCT(design.product_id)')
        .getCount(),
    ]);

    return {
      total,              // Tổng số cấu hình thiết kế
      activeDesigns: linkedToArtwork, // Thiết kế đã hoàn tất (có Artwork)
      pendingDesigns: total - linkedToArtwork, // Thiết kế chưa có Artwork (cần xử lý)
      designedProducts: attachedToProduct // Số sản phẩm đã có ít nhất 1 thiết kế
    };
  }
}
