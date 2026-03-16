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

@Injectable()
export class DesignService {
  productRepository: any;
  mockupRepository: any;
  artworkRepo: any;
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Variant) private variantRepo: Repository<Variant>,
    @InjectRepository(Design) private designRepo: Repository<Design>,
  ) {}

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
      select: {
        id: true,
        name: true,
        thumbnailUrl: true,
        createdAt: true,
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

  async getDesignForSeller(sellerId: number, productId: number) {
    const design = await this.dataSource.getRepository(Design).findOne({
      where: { product: { id: productId, seller: { id: sellerId } } },
      relations: [
        'artworks',
        'product.variants',
        'product.variants.mockup',
        'product.variants.mockup.printArea',
      ],
    });

    if (!design) throw new NotFoundException('Thiết kế chưa được khởi tạo');
    return design;
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
}
