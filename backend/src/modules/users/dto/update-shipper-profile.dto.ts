import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateShipperProfileDto {
    @IsOptional()
    @IsString()
    @Length(3, 20, { message: 'Biển số xe không hợp lệ' })
    vehiclePlate?: string;

    // --- CÁC TRƯỜNG ĐỊA CHỈ CẤU TRÚC ---
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

    // Trường lưu trữ chuỗi gộp cuối cùng
    @IsOptional()
    @IsString()
    shipperAddress?: string;
}