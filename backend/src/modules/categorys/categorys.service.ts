import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      // 1. Kiểm tra trùng tên (Optional: Có thể để DB tự bắt lỗi nhưng check code sẽ custom message tốt hơn)
      const existingCategory = await this.categoryRepository.findOne({
        where: { categoryName: createCategoryDto.categoryName },
      });

      if (existingCategory) {
        throw new ConflictException('Tên danh mục đã tồn tại');
      }

      // 2. Tạo instance mới
      const newCategory = this.categoryRepository.create(createCategoryDto);

      // 3. Lưu xuống DB
      return await this.categoryRepository.save(newCategory);
    } catch (error) {
      // Ném lại lỗi nếu đó là lỗi ConflictException mình vừa tạo
      if (error instanceof ConflictException) {
        throw error;
      }
      // Các lỗi khác (vd: mất kết nối DB)
      throw new InternalServerErrorException('Lỗi khi tạo danh mục');
    }
  }
}
