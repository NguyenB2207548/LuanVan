import { PartialType } from '@nestjs/mapped-types';
import { CreateAttributeValueDto } from './create-attribute_value.dto';

export class UpdateAttributeValueDto extends PartialType(CreateAttributeValueDto) {}
