import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { VariantsService } from './variants.service';
import { CreateVariantDto } from './dto/create-variant.dto';

@Controller('variants')
export class VariantsController {
  constructor(private readonly variantService: VariantsService) {}
  @Get()
  findAll() {
    return this.variantService.findAll();
  }

  @Get('by-product/:id')
  findVariantsByProductId(@Param('id') id: number) {
    return this.variantService.findVariantsByProductId(id);
  }

  @Post('by-product/:id')
  createVariants(
    @Param('id') id: number,
    @Body() createVariantDto: CreateVariantDto,
  ) {
    return this.variantService.createVariants(id, createVariantDto);
  }

  @Delete(':id')
  deleteById(@Param('id') id: number) {
    const deleted = this.variantService.delete(id);
    return { message: 'Xóa variant thành công', data: deleted };
  }
}
