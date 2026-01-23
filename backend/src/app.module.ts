import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { CategorysModule } from './modules/categorys/categorys.module';
import { ProductsModule } from './modules/products/products.module';
import { VariantsModule } from './modules/variants/variants.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { AttributeValuesModule } from './modules/attribute_values/attribute_values.module';
import { PricesModule } from './modules/prices/prices.module';
import { CartsModule } from './modules/carts/carts.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ImagesModule } from './modules/images/images.module';
import { DesignsModule } from './modules/designs/designs.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    CategorysModule,
    ProductsModule,
    VariantsModule,
    AttributesModule,
    AttributeValuesModule,
    PricesModule,
    CartsModule,
    OrdersModule,
    ReviewsModule,
    ImagesModule,
    DesignsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
