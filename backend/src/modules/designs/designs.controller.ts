import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Param,
  Get,
  ParseIntPipe,
  Query,
  Request,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { DesignService } from './designs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateMockupDto } from './dto/update-mockup.dto';
import { CreatePrintAreaDto } from './dto/create-print-area.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { UpdateArtworkDto } from './dto/update-artwork.dto';
import { UpdateDesignDto } from './dto/update-design.dto';

@Controller('designs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class DesignController {
  constructor(private readonly designService: DesignService) {}

  // ======================= MOCKUP =========================

  @Patch('variant/:id/mockup')
  async updateMockup(
    @Req() req: any,
    @Param('id', ParseIntPipe) variantId: number,
    @Body() dto: UpdateMockupDto,
  ) {
    return this.designService.updateVariantMockup(req.user.id, variantId, dto);
  }

  // API thêm Mockup cho Variant (Nhận URL từ Asset Manager)
  @Post('variant/:variantId/mockup')
  async addVariantMockup(
    @Req() req: any,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() dto: UpdateMockupDto, // dto này bây giờ chứa trường url
  ) {
    // Không cần 'file' nữa vì ảnh đã có trên server
    return this.designService.addMockupToVariant(req.user.id, variantId, dto);
  }

  // API thêm Mockup chung cho Sản phẩm
  @Post('product/:productId/mockup')
  async addProductMockup(
    @Req() req: any,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateMockupDto,
  ) {
    return this.designService.addMockupToProduct(req.user.id, productId, dto);
  }

  // ======================= PRINT AREA =========================

  // API thêm PrintArea cho Mockup (Dùng chung cho cả Mockup của Product và Variant)
  @Patch('mockup/:mockupId/print-area')
  @Roles(UserRole.SELLER)
  async setPrintArea(
    @Req() req: any,
    @Param('mockupId', ParseIntPipe) mockupId: number,
    @Body() dto: CreatePrintAreaDto,
  ) {
    const sellerId = req.user.id;
    return this.designService.addPrintArea(sellerId, mockupId, dto);
  }

  // ======================= ARTWORK =========================

  @Get('seller/artworks')
  async getSellerArtworks(@Req() req: any) {
    return this.designService.getSellerArtworks(req.user.id);
  }

  @Post('seller/artworks')
  async createArtworks(@Req() req: any, @Body() dto: CreateArtworkDto) {
    return this.designService.createArtwork(req.user.id, dto);
  }

  @Get('seller/artworks/stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req) {
    // req.user.id lấy từ token của Seller
    return await this.designService.getSellerArtworkStats(req.user.id);
  }

  @Get('seller/artworks/:id')
  @UseGuards(JwtAuthGuard)
  async getArtworkDetail(@Param('id') id: number, @Request() req) {
    // req.user.id là ID của Seller đang đăng nhập
    return await this.designService.getArtworkById(id, req.user.id);
  }

  @Patch('seller/artworks/:id')
  @UseGuards(JwtAuthGuard)
  async updateArtwork(
    @Param('id') id: number,
    @Body() updateArtworkDto: UpdateArtworkDto,
    @Request() req,
  ) {
    // req.user.id lấy từ JWT Token
    return await this.designService.updateArtwork(
      id,
      req.user.id,
      updateArtworkDto,
    );
  }

  @Delete('seller/artworks/:id')
  async deleteArtwork(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.designService.deleteArtwork(id, req.user.id);
  }

  // ======================= DESIGN =========================

  @Post()
  async create(@Req() req: any, @Body() dto: CreateDesignDto) {
    return this.designService.createDesign(req.user.id, dto);
  }

  @Get('seller/list')
  @UseGuards(JwtAuthGuard)
  async getSellerDesignList(@Req() req: any) {
    return this.designService.getDesignsBySeller(req.user.id);
  }

  @Get('seller/designs/stats')
  @UseGuards(JwtAuthGuard)
  async getDesignStats(@Request() req) {
    return await this.designService.getSellerDesignStats(req.user.id);
  }

  @Get('seller/designs/:id')
  @UseGuards(JwtAuthGuard)
  async getDesignDetail(@Param('id') id: string, @Request() req) {
    const designId = parseInt(id, 10);

    if (isNaN(designId)) {
      throw new BadRequestException('ID thiết kế không hợp lệ');
    }

    return await this.designService.getDesignByIdForEdit(designId, req.user.id);
  }
  @Patch(':id')
  async updateDesign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDesignDto,
  ) {
    return this.designService.updateDesign(id, dto);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async adminGetAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.designService.adminGetAllDesigns(page, limit);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async deleteDesign(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const sellerId = req.user.userId;
    return this.designService.deleteDesign(id, sellerId);
  }
}
