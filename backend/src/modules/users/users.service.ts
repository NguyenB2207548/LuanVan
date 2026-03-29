import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity'; // Đảm bảo import đúng Entity User
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { SellerProfile } from './entities/seller-profile.entity';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { ShipperProfile } from './entities/shipper-profile.entity';
import { UpdateShipperProfileDto } from './dto/update-shipper-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SellerProfile)
    private readonly sellerRepository: Repository<SellerProfile>,
    @InjectRepository(ShipperProfile)
    private readonly shipperRepository: Repository<ShipperProfile>,
  ) { }

  async getMe(userId: number) {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống!');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.passwordHash, 10);

    const newUser = this.userRepository.create({
      ...createUserDto,
      passwordHash: hashedPassword,
    });

    return await this.userRepository.save(newUser);
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    return await this.userRepository.delete(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }


  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // 1. Sửa user.password -> user.passwordHash
    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    // 2. Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt();
    // Sửa user.password -> user.passwordHash
    user.passwordHash = await bcrypt.hash(dto.newPassword, salt);

    return this.userRepository.save(user);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('Email không tồn tại');

    const salt = await bcrypt.genSalt();
    // Sửa user.password -> user.passwordHash
    user.passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.userRepository.save(user);
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  // SELLER
  async updateSellerProfile(userId: number, updateDto: UpdateSellerProfileDto): Promise<SellerProfile> {
    const profile = await this.sellerRepository.findOne({ where: { userId } });

    if (!profile) {
      throw new NotFoundException(`Không tìm thấy profile`);
    }

    // BÓC TÁCH: Lấy hết các trường địa chỉ (bao gồm cả shopAddress) ra ngoài
    const { province, district, ward, addressDetail, shopAddress, ...otherData } = updateDto;

    // 1. Gộp địa chỉ mới
    if (province && district && ward && addressDetail) {
      profile.shopAddress = `${addressDetail}, ${ward}, ${district}, ${province}`;
    }

    // 2. Lúc này otherData chỉ còn lại shopName, rating... 
    // shopAddress đã bị bóc ra ở trên nên Object.assign sẽ không ghi đè bậy bạ nữa
    Object.assign(profile, otherData);

    // 3. Lưu lại
    return await this.sellerRepository.save(profile);
  }


  async getSellerProfile(userId: number): Promise<SellerProfile> {
    const profile = await this.sellerRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Cửa hàng chưa được thiết lập.');
    return profile;
  }

  // SHIPPER

  // 1. Lấy thông tin Shipper
  async getShipperProfile(userId: number) {
    const profile = await this.shipperRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Không tìm thấy thông tin vận chuyển');
    }
    return profile;
  }

  async updateShipperProfile(userId: number, updateDto: UpdateShipperProfileDto) {
    const profile = await this.shipperRepository.findOne({ where: { userId } });

    if (!profile) {
      throw new NotFoundException(`Không tìm thấy hồ sơ shipper cho User ID ${userId}`);
    }

    const { province, district, ward, addressDetail, ...otherData } = updateDto;

    if (province && district && ward && addressDetail) {
      profile.address = `${addressDetail}, ${ward}, ${district}, ${province}`;
    }

    Object.assign(profile, otherData);

    return await this.shipperRepository.save(profile);
  }

  async getUserStats() {
    const [total, active, inactive, rolesCount] = await Promise.all([
      // 1. Tổng số người dùng
      this.userRepository.count(),

      // 2. Tài khoản đang hoạt động
      this.userRepository.count({ where: { isActive: true } }),

      // 3. Tài khoản bị vô hiệu hóa
      this.userRepository.count({ where: { isActive: false } }),

      // 4. Thống kê số lượng theo vai trò (Role)
      // Giả sử ông dùng trường role là số (0: user/admin, 1: seller, 2: shipper...) 
      // hoặc string. Tui sẽ dùng query builder để group cho linh hoạt:
      this.userRepository
        .createQueryBuilder('user')
        .select('user.role', 'role')
        .addSelect('COUNT(user.id)', 'count')
        .groupBy('user.role')
        .getRawMany(),
    ]);

    return {
      total,
      active,
      inactive,
      roles: rolesCount,
    };
  }

  // Vô hiệu hóa người dùng (Admin call)
  async deactivate(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    // Không cho phép Admin tự khóa chính mình (Bảo mật cơ bản)
    // if (user.role === 'admin') throw new BadRequestException('Không thể khóa tài khoản Admin.');

    await this.userRepository.update(id, { isActive: false });
    return {
      success: true,
      message: `Đã khóa tài khoản ${user.email} thành công.`
    };
  }

  // Khôi phục người dùng (Admin call)
  async activate(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    await this.userRepository.update(id, { isActive: true });
    return {
      success: true,
      message: `Tài khoản ${user.email} đã được mở khóa.`
    };
  }

}
