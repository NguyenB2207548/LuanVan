import { Module } from '@nestjs/common';
import { AttributeValuesService } from './attribute_values.service';
import { AttributeValuesController } from './attribute_values.controller';

@Module({
  controllers: [AttributeValuesController],
  providers: [AttributeValuesService],
})
export class AttributeValuesModule {}
