// src/modules/products/attributes.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AttributesService } from './attributes.service';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  async findAll() {
    return await this.attributesService.findAll();
  }
}
