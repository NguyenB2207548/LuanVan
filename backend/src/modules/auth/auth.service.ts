import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    return this.usersService.create({
      email: dto.email,
      passwordHash: dto.password,
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      role: dto.role || UserRole.USER,
    });
  }

  async login(loginDto: any) {
    const user = await this.usersService.findByEmail(loginDto.email);
    console.log(user);
    if (!user)
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');

    const isPasswordMatching = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordMatching)
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    };
  }
}
