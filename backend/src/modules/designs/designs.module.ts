import { Module } from '@nestjs/common';
import { DesignsService } from './designs.service';
import { DesignsController } from './designs.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Design } from './entities/design.entity';
import { DesignOption } from './entities/design-option.entity';
import { LinkDesign } from './entities/design-link.entity';
import { Product } from '../products/entities/product.entity';
import { Variant } from '../products/entities/variant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Design,
      DesignOption,
      LinkDesign,
      Product,
      Variant,
    ]),
  ],
  controllers: [DesignsController],
  providers: [DesignsService],
})
export class DesignsModule {}
