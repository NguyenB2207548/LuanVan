import {
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { DesignOptionType } from '../entities/design-option.entity';

export class DesignOptionDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsEnum(DesignOptionType)
  @IsNotEmpty()
  optionType: DesignOptionType;

  @IsString()
  @IsNotEmpty()
  targetLayerId: string;

  @IsOptional()
  config?: any;
}

export class UpdateDesignOptionsDto {
  @IsNotEmpty()
  options: DesignOptionDto[];
}
