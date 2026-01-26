import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Product } from './entities/product.entity';
import { Variant } from './entities/variant.entity';
import { Attribute } from './entities/attribute.entity';
import { AttributeValue } from './entities/attribute_value.entity';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Variant, Attribute, AttributeValue]),
  ],
  controllers: [ProductsController, AttributesController],
  providers: [ProductsService, AttributesService],
  exports: [AttributesService],
})
export class ProductsModule {}
