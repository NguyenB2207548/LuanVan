import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  logger: any;
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new InternalServerErrorException('Danh mục không tồn tại');
    }
    return category;
  }
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const existingCategory = await this.categoryRepository.findOne({
        where: { categoryName: createCategoryDto.categoryName },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Danh mục "${createCategoryDto.categoryName}" đã tồn tại`,
        );
      }

      const newCategory = this.categoryRepository.create(createCategoryDto);

      return await this.categoryRepository.save(newCategory);
    } catch (error) {
      this.logger.error(`Lỗi khi tạo danh mục: ${error.message}`, error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }

      // Nếu là lỗi khác (ví dụ: mất kết nối DB), ném lỗi 500 kèm tin nhắn chi tiết nếu đang ở môi trường dev
      throw new InternalServerErrorException(
        process.env.NODE_ENV === 'development'
          ? `Lỗi DB: ${error.message}`
          : 'Có lỗi xảy ra trong quá trình tạo danh mục',
      );
    }
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new InternalServerErrorException('Danh mục không tồn tại');
    }
    const updatedCategory = await this.categoryRepository.merge(
      category,
      updateCategoryDto,
    );
    return await this.categoryRepository.save(updatedCategory);
  }

  async delete(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new InternalServerErrorException('Danh mục không tồn tại');
    }

    await this.categoryRepository.delete(id);
  }
}
