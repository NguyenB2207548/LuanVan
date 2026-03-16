import {
  Controller,
  Post,
  Body,
  Get,
  ParseIntPipe,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ProductSearchDto } from './dto/search-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }
  @Get('seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async findAllBySeller(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const user = req.user;
    const sellerId = user.id;

    return this.productsService.findAllBySeller(sellerId, page, limit);
  }

  @Get('latest')
  async getLatest() {
    return this.productsService.getLatestProducts();
  }

  @Get('trending')
  async getTrending() {
    return this.productsService.getTrendingProducts();
  }

  @Get('search')
  async search(@Query() query: ProductSearchDto) {
    return this.productsService.searchProducts(query);
  }

  @Get('designer/list')
  async getListForDesigner(@Req() req: any) {
    return this.productsService.findAllForDesigner(req.user.id);
  }

  // @Get(':productId/pod-config')
  // async getPodConfig(@Param('productId', ParseIntPipe) productId: number) {
  //   return this.productsService.getPodDesignByProductId(productId);
  // }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.findOne(id);
  }

  @Get(':id/related')
  async getRelated(
    @Param('id') id: number,
    @Query('categoryId') categoryId: number,
  ) {
    return this.productsService.getRelatedProducts(id, categoryId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  create(@Body() createProductDto: CreateProductDto, @Request() req) {
    const sellerId = req.user.id;
    return this.productsService.create(createProductDto, sellerId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.remove(id);
    return {
      message: 'Xóa sản phẩm thành công',
    };
  }
}
