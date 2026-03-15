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
} from '@nestjs/common';
import { DesignService } from './designs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateDesignDto, UpdateMockupDto } from './dto/create-design.dto';
import { CreatePrintAreaDto } from './dto/create-print-area.dto';

@Controller('designs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class DesignController {
  constructor(private readonly designService: DesignService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateDesignDto) {
    return this.designService.createDesign(req.user.id, dto);
  }

  @Patch('variant/:id/mockup')
  async updateMockup(
    @Req() req: any,
    @Param('id', ParseIntPipe) variantId: number,
    @Body() dto: UpdateMockupDto,
  ) {
    return this.designService.updateVariantMockup(req.user.id, variantId, dto);
  }

  @Get('product/:productId')
  async getByProduct(
    @Req() req: any,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.designService.getDesignForSeller(req.user.id, productId);
  }

  // API thêm Mockup cho Variant
  @Post('variant/:variantId/mockup')
  async addVariantMockup(
    @Req() req: any,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() dto: UpdateMockupDto,
  ) {
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

  @Get('product/:productId/preview')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getPreview(
    @Req() req: any,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.designService.getDesignPreview(
      req.user.id,
      req.user.role,
      productId,
    );
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async adminGetAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.designService.adminGetAllDesigns(page, limit);
  }
}
