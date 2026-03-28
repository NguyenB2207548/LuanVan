import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

  async create(userId: number, dto: CreateReviewDto) {
    // 1. Kiểm tra sản phẩm có tồn tại không
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    // 2. Kiểm tra rating hợp lệ (1-5)
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Số sao phải từ 1 đến 5');
    }

    // 3. Tạo review mới
    const review = this.reviewRepository.create({
      rating: dto.rating,
      comment: dto.comment,
      user: { id: userId }, // Map ID người dùng
      product: { id: dto.productId }, // Map ID sản phẩm
    });

    return await this.reviewRepository.save(review);
  }

  // Lấy danh sách review của 1 sản phẩm
  async findByProduct(productId: number) {
    return await this.reviewRepository.find({
      where: { product: { id: productId } },
      relations: ['user'], // Để hiển thị tên người đánh giá
      order: { createdAt: 'DESC' },
    });
  }
}