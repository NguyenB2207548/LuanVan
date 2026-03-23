import { IsString, IsUrl } from 'class-validator';

export class LayerSeparationDto {
    @IsUrl({}, { message: 'URL ảnh không hợp lệ' })
    imageUrl: string;

    @IsString()
    prompt: string;
}