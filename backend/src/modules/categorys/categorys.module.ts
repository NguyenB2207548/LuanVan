import { Module } from '@nestjs/common';
import { CategoriesService } from './categorys.service';
import { CategoriesController } from './categorys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategorysModule {}
