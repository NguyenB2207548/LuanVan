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
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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

  // Vô hiệu hóa người dùng
  async deactivate(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng để vô hiệu hóa.');
    }

    if (!user.isActive) {
      throw new BadRequestException(
        'Tài khoản này đã bị vô hiệu hóa từ trước.',
      );
    }

    await this.userRepository.update(id, { isActive: false });
    return { message: `Tài khoản ${user.email} đã được vô hiệu hóa.` };
  }

  // Khôi phục người dùng
  async activate(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng để khôi phục.');
    }

    if (user.isActive) {
      throw new BadRequestException('Tài khoản này hiện đang hoạt động.');
    }

    await this.userRepository.update(id, { isActive: true });
    return { message: `Tài khoản ${user.email} đã được khôi phục thành công.` };
  }
}
