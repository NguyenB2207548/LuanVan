import { IsString, IsOptional, Length, IsNumber, Min, Max } from 'class-validator';

export class UpdateSellerProfileDto {
    @IsOptional()
    @IsString()
    @Length(3, 150)
    shopName?: string;

    // --- CÁC TRƯỜNG ĐỊA CHỈ MỚI ---
    @IsOptional()
    @IsString()
    province?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    ward?: string;

    @IsOptional()
    @IsString()
    addressDetail?: string;

    // Trường này sẽ dùng để lưu chuỗi gộp cuối cùng
    @IsOptional()
    @IsString()
    shopAddress?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(5)
    rating?: number;
}