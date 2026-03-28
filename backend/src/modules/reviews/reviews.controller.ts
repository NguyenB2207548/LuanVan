import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(@Request() req, @Body() dto: CreateReviewDto) {
    // req.user.id lấy từ token sau khi đăng nhập
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get('product/:productId')
  async getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(+productId);
  }
}