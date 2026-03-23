import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { CategorysModule } from './modules/categorys/categorys.module';
import { ProductsModule } from './modules/products/products.module';
import { CartsModule } from './modules/carts/carts.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ImagesModule } from './modules/images/images.module';
import { DesignsModule } from './modules/designs/designs.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { AiDesignModule } from './modules/ai-design/ai-design.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    DatabaseModule,
    CategorysModule,
    ProductsModule,
    CartsModule,
    OrdersModule,
    ReviewsModule,
    ImagesModule,
    DesignsModule,
    AuthModule,
    UploadsModule,
    StatisticsModule,
    AiDesignModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
