import { IsString, IsObject, IsNotEmpty } from 'class-validator';

export class CreateArtworkDto {
  @IsString()
  artworkName: string;

  @IsObject()
  @IsNotEmpty({ message: 'Dữ liệu template JSON không được để trống' })
  layersJson: any;
}
