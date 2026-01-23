import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DesignsService } from './designs.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';

@Controller('designs')
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  @Post()
  create(@Body() createDesignDto: CreateDesignDto) {
    return this.designsService.create(createDesignDto);
  }

  @Get()
  findAll() {
    return this.designsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDesignDto: UpdateDesignDto) {
    return this.designsService.update(+id, updateDesignDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designsService.remove(+id);
  }
}
