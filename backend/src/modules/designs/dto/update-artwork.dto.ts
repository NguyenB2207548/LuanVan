import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateArtworkDto {
    @IsOptional()
    @IsString()
    artworkName?: string;

    @IsOptional()
    @IsObject()
    layersJson?: any;
}