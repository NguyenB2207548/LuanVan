import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from './entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.usersService.getMe(req.user.id);
  }

  // SELLER
  @UseGuards(JwtAuthGuard)
  @Get('seller/profile')
  async getMyProfile(@Request() req) {
    // req.user.id lấy từ JWT Strategy
    return this.usersService.getSellerProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('seller/profile')
  async updateProfile(
    @Request() req,
    @Body() updateDto: UpdateSellerProfileDto
  ) {
    return this.usersService.updateSellerProfile(req.user.id, updateDto);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(+id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async activate(@Param('id') id: string) {
    return this.usersService.activate(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password/:id')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(+id, changePasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(resetPasswordDto);
  }



}
