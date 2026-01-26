import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Design } from './entities/design.entity';
import { CreateDesignDto } from './dto/create-design.dto';
import { CreateLinkDesignDto } from './dto/create-link-design.dto';
import { DesignOwnerType, LinkDesign } from './entities/design-link.entity';
import { Product } from '../products/entities/product.entity';
import { Variant } from '../products/entities/variant.entity';
import { UpdateDesignDto } from './dto/update-design.dto';

@Injectable()
export class DesignsService {
  constructor(
    @InjectRepository(Design)
    private readonly designRepository: Repository<Design>,
    @InjectRepository(LinkDesign)
    private linkRepo: Repository<LinkDesign>,
    @InjectRepository(Design)
    private designRepo: Repository<Design>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Variant)
    private variantRepo: Repository<Variant>,
  ) {}

  async create(createDesignDto: CreateDesignDto): Promise<Design> {
    const newDesign = this.designRepository.create(createDesignDto);
    return await this.designRepository.save(newDesign);
  }

  async findAll(): Promise<Design[]> {
    return await this.designRepository.find();
  }

  async findOne(id: number): Promise<Design> {
    const design = await this.designRepository.findOne({
      where: { id },
      relations: ['options'],
    });

    if (!design) {
      throw new NotFoundException(`Mẫu thiết kế với ID #${id} không tồn tại`);
    }

    return design;
  }

  async linkDesign(dto: CreateLinkDesignDto) {
    // 1. Kiểm tra Design có tồn tại không
    const design = await this.designRepository.findOne({
      where: { id: dto.designId },
    });
    if (!design) throw new NotFoundException('Mẫu thiết kế không tồn tại');

    // 2. Kiểm tra đối tượng đích (Product hoặc Variant)
    if (dto.ownerType === DesignOwnerType.PRODUCT) {
      const product = await this.productRepo.findOne({
        where: { id: dto.ownerId },
      });
      if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    } else {
      const variant = await this.variantRepo.findOne({
        where: { id: dto.ownerId },
      });
      if (!variant) throw new NotFoundException('Biến thể không tồn tại');
    }

    // 3. Kiểm tra xem liên kết đã tồn tại chưa để tránh trùng lặp
    const existingLink = await this.linkRepo.findOne({
      where: {
        design: { id: dto.designId },
        ownerType: dto.ownerType,
        ownerId: dto.ownerId,
      },
    });
    if (existingLink) throw new BadRequestException('Liên kết này đã tồn tại');

    // 4. Tạo liên kết mới
    const newLink = this.linkRepo.create({
      design,
      ownerType: dto.ownerType,
      ownerId: dto.ownerId,
    });

    return await this.linkRepo.save(newLink);
  }

  async update(id: number, updateDesignDto: UpdateDesignDto): Promise<Design> {
    const design = await this.designRepository.findOne({ where: { id } });

    if (!design) {
      throw new NotFoundException(`Không tìm thấy mẫu thiết kế với ID #${id}`);
    }

    const updatedDesign = this.designRepository.merge(design, updateDesignDto);

    return await this.designRepository.save(updatedDesign);
  }
}
