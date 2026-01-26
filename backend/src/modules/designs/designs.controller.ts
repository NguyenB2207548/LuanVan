import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { DesignsService } from './designs.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { CreateLinkDesignDto } from './dto/create-link-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';

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
}
