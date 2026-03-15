import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Design } from './entities/design.entity';
import { Artwork } from './entities/artwork.entity';
import { Mockup } from './entities/mockup.entity';
import { PrintArea } from './entities/print_area.entity';
import { Product } from '../products/entities/product.entity';
import { Variant } from '../products/entities/variant.entity';
import { CreateDesignDto, UpdateMockupDto } from './dto/create-design.dto';
import { CreatePrintAreaDto } from './dto/create-print-area.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class DesignService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Variant) private variantRepo: Repository<Variant>,
  ) {}

  // 1. Tạo Design gốc cho Product
  async createDesign(sellerId: number, dto: CreateDesignDto) {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, seller: { id: sellerId } },
    });

    if (!product)
      throw new ForbiddenException('Sản phẩm không thuộc quyền sở hữu của bạn');

    return await this.dataSource.transaction(async (manager) => {
      const design = manager.create(Design, {
        name: dto.name,
        product: product,
      });
      const savedDesign = await manager.save(design);

      if (dto.artworks?.length) {
        const artworks = dto.artworks.map((art) =>
          manager.create(Artwork, {
            ...art,
            design: savedDesign,
          }),
        );
        await manager.save(artworks);
      }
      return savedDesign;
    });
  }

  // 2. Cấu hình Mockup và PrintArea cho từng Variant
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
      // Xử lý Mockup
      let mockup = variant.mockup;
      if (!mockup) {
        mockup = manager.create(Mockup, { variant });
      }
      mockup.url = dto.url;
      const savedMockup = await manager.save(mockup);

      // Xử lý PrintArea
      let printArea = savedMockup.printArea;
      if (!printArea) {
        printArea = manager.create(PrintArea, { mockup: savedMockup });
      }
      printArea.x = dto.x;
      printArea.y = dto.y;
      printArea.width = dto.width;
      printArea.height = dto.height;
      printArea.realWidthInch = dto.realWidthInch;
      printArea.realHeightInch = dto.realHeightInch;

      await manager.save(printArea);
      return { message: 'Cập nhật Mockup và Vùng in thành công' };
    });
  }

  // 3. Lấy chi tiết thiết kế để Seller chỉnh sửa
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

  async addMockupToVariant(sellerId: number, variantId: number, dto: any) {
    return await this.dataSource.transaction(async (manager) => {
      // Kiểm tra quyền sở hữu
      const variant = await manager.findOne(Variant, {
        where: { id: variantId, product: { seller: { id: sellerId } } },
        relations: ['mockup', 'mockup.printArea'],
      });

      if (!variant)
        throw new ForbiddenException(
          'Bạn không có quyền chỉnh sửa biến thể này',
        );

      // Tạo hoặc cập nhật Mockup
      let mockup = variant.mockup;
      if (!mockup) {
        mockup = manager.create(Mockup, { variant });
      }
      mockup.url = dto.url;
      const savedMockup = await manager.save(mockup);

      // Tạo hoặc cập nhật PrintArea (Vùng in)
      let printArea = savedMockup.printArea;
      if (!printArea) {
        printArea = manager.create(PrintArea, { mockup: savedMockup });
      }
      printArea.x = dto.x;
      printArea.y = dto.y;
      printArea.width = dto.width;
      printArea.height = dto.height;
      printArea.realWidthInch = dto.realWidthInch;
      printArea.realHeightInch = dto.realHeightInch;

      await manager.save(printArea);
      return {
        message: 'Thêm Mockup cho Variant thành công',
        mockupId: savedMockup.id,
      };
    });
  }

  // 2. Thêm Mockup cho Product (Dùng làm ảnh hiển thị mặc định cho Design)
  async addMockupToProduct(sellerId: number, productId: number, dto: any) {
    const product = await this.dataSource.getRepository(Product).findOne({
      where: { id: productId, seller: { id: sellerId } },
    });

    if (!product) throw new ForbiddenException('Sản phẩm không thuộc về bạn');

    const mockup = this.dataSource.getRepository(Mockup).create({
      url: dto.url,
      product: product,
    });

    return await this.dataSource.getRepository(Mockup).save(mockup);
  }

  async addPrintArea(
    sellerId: number,
    mockupId: number,
    dto: CreatePrintAreaDto,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Tìm Mockup và kiểm tra quyền sở hữu (thông qua Product hoặc Variant)
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

      // 2. Xử lý PrintArea (Upsert logic)
      let printArea = mockup.printArea;

      if (!printArea) {
        // Nếu chưa có vùng in thì khởi tạo mới
        printArea = manager.create(PrintArea, {
          mockup: mockup,
        });
      }

      // 3. Cập nhật các thông số
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

  async getDesignPreview(userId: number, userRole: string, productId: number) {
    // 1. Khởi tạo query options
    const whereCondition: any = {
      product: { id: productId },
    };

    // Nếu KHÔNG PHẢI ADMIN, thì bắt buộc phải kiểm tra đúng seller sở hữu sản phẩm
    if (userRole !== UserRole.ADMIN) {
      whereCondition.product.seller = { id: userId };
    }

    const design = await this.dataSource.getRepository(Design).findOne({
      where: whereCondition,
      relations: [
        'artworks',
        'product',
        'product.variants',
        'product.variants.mockup',
        'product.variants.mockup.printArea',
      ],
      order: {
        artworks: { order: 'ASC' },
      },
    });

    if (!design) {
      throw new NotFoundException(
        userRole === UserRole.ADMIN
          ? 'Không tìm thấy thiết kế cho sản phẩm này'
          : 'Sản phẩm không tồn tại hoặc bạn không có quyền truy cập',
      );
    }

    // 2. Format lại dữ liệu (giữ nguyên logic mapping của bạn)
    return {
      id: design.id,
      designName: design.name,
      productId: design.product.id,
      layers: design.artworks.map((art) => ({
        id: art.id,
        content: JSON.parse(art.layersJson),
        order: art.order,
      })),
      previews: design.product.variants.map((variant) => ({
        variantId: variant.id,
        variantName: variant.sku,
        mockupUrl: variant.mockup?.url || null,
        printArea: variant.mockup?.printArea
          ? {
              x: variant.mockup.printArea.x,
              y: variant.mockup.printArea.y,
              width: variant.mockup.printArea.width,
              height: variant.mockup.printArea.height,
              aspectRatio:
                variant.mockup.printArea.width /
                variant.mockup.printArea.height,
            }
          : null,
      })),
    };
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
        designName: design.name,
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
