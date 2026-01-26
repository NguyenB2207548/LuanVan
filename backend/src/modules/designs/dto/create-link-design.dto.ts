import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { DesignOwnerType } from '../entities/design-link.entity';

export class CreateLinkDesignDto {
  @IsInt()
  @IsNotEmpty()
  designId: number;

  @IsEnum(DesignOwnerType)
  @IsNotEmpty()
  ownerType: DesignOwnerType;

  @IsInt()
  @IsNotEmpty()
  ownerId: number;
}
