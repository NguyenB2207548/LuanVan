import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
// import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Product } from './entities/product.entity';
import { Variant } from './entities/variant.entity';
import { Attribute } from './entities/attribute.entity';
import { AttributeValue } from './entities/attribute_value.entity';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';
import { VariantsController } from './variants.controller';
import { VariantsService } from './variants.service';
import { Image } from '../images/entities/image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Variant,
      Attribute,
      AttributeValue,
      Image,
    ]),
  ],
  controllers: [ProductsController, AttributesController, VariantsController],
  providers: [ProductsService, AttributesService, VariantsService],
  exports: [ProductsService, AttributesService, VariantsService],
})
export class ProductsModule {}
