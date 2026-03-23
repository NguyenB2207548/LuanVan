import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignService } from './designs.service';
import { DesignController } from './designs.controller';
import { Design } from './entities/design.entity';
import { Artwork } from './entities/artwork.entity';
import { Mockup } from './entities/mockup.entity';
import { PrintArea } from './entities/print_area.entity';
import { Product } from '../products/entities/product.entity';
import { Variant } from '../products/entities/variant.entity';
import { PsdController } from './psd.controller';
import { PsdService } from './psd.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Design,
      Artwork,
      Mockup,
      PrintArea,
      Product,
      Variant,
    ]),
  ],
  controllers: [DesignController, PsdController],
  providers: [DesignService, PsdService],
})
export class DesignsModule { }
