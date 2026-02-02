import { IsString, IsNotEmpty } from 'class-validator';

export class ExportLayersDto {
  @IsString()
  @IsNotEmpty()
  psdFileName: string;

  @IsString()
  @IsNotEmpty()
  outputFolderName: string;
}
