// src/modules/products/attributes.controller.ts
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  async findAll() {
    return await this.attributesService.findAll();
  }

  @Post()
  async create(@Body() createAttributeDto: CreateAttributeDto) {
    const data = await this.attributesService.create(createAttributeDto);

    return {
      message: 'Tạo thuộc tính mới thành công',
      data: data,
    };
  }

  @Post('values')
  async addValue(@Body() createAttributeValueDto: CreateAttributeValueDto) {
    const data = await this.attributesService.addAttributeValue(
      createAttributeValueDto,
    );
    return {
      message: 'Thêm giá trị thuộc tính thành công',
      data: data,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    await this.attributesService.deleteAttribute(id);
    return {
      message: 'Xóa thuộc tính thành công',
    };
  }

  @Delete('values/:id')
  async deleteValue(@Param('id') id: number) {
    await this.attributesService.deleteAttributeValue(id);
    return {
      message: 'Xóa giá trị thuộc tính thành công',
    };
  }
}
