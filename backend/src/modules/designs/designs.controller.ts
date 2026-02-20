import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { DesignsService } from './designs.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { CreateLinkDesignDto } from './dto/create-link-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { UpdateDesignOptionsDto } from './dto/create-design-option.dto';
import { GetActiveDesignDto } from './dto/get-active-design.dto';

@Controller('designs')
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  @Post()
  async create(@Body() createDesignDto: CreateDesignDto) {
    const design = await this.designsService.create(createDesignDto);
    return {
      message: 'Tạo mẫu thiết kế mới thành công',
      data: design,
    };
  }

  @Get()
  async findAll() {
    return await this.designsService.findAll();
  }

  @Get(':id')
  async getDesignByVariant(@Param('id', ParseIntPipe) variantId: number) {
    if (!variantId) {
      throw new BadRequestException('variantId query parameter is required');
    }

    const design = await this.designsService.getDesignByVariant(variantId);
    return {
      message: 'Lấy thiết kế theo biến thể thành công',
      data: design,
    };
  }

  @Get('active')
  async getActiveDesign(@Query() query: GetActiveDesignDto) {
    console.log('Query received:', query);
    console.log('productId type:', typeof query.productId);
    console.log('variantId type:', typeof query.variantId);
    return this.designsService.getActiveDesign(
      query.productId,
      query.variantId,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.designsService.findOne(id);
  }

  @Post('link')
  async createLink(@Body() dto: CreateLinkDesignDto) {
    return await this.designsService.linkDesign(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDesignDto: UpdateDesignDto,
  ) {
    const updatedData = await this.designsService.update(id, updateDesignDto);
    return {
      message: 'Cập nhật mẫu thiết kế thành công',
      data: updatedData,
    };
  }

  @Get(':id')
  async getDesignDetail(@Param('id', ParseIntPipe) id: number) {
    return this.designsService.findOne(id);
  }

  @Post(':id/options')
  async updateOptions(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOptionsDto: UpdateDesignOptionsDto,
  ) {
    return this.designsService.updateDesignOptions(id, updateOptionsDto);
  }

  @Post('extract-layers')
  async extractLayers(@Body('fileName') fileName: string) {
    return await this.designsService.extractPsdLayersOnly(fileName);
  }
}
