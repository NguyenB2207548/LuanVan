import { IsString, IsOptional, Length, IsNumber, Min, Max } from 'class-validator';
// import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSellerProfileDto {
    @IsOptional()
    @IsString()
    @Length(3, 150)
    shopName?: string;

    @IsOptional()
    @IsString()
    shopAddress?: string;

    // Thường rating do hệ thống tính, nhưng nếu bạn muốn admin sửa thì để ở đây
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(5)
    rating?: number;
}