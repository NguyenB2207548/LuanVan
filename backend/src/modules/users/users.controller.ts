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
  Query,
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
import { UpdateShipperProfileDto } from './dto/update-shipper-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin/recent')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getRecentUsers(@Query('limit') limit?: string) {
    return this.usersService.getRecentUsers(limit ? +limit : 5);
  }

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
    @Body() updateDto: UpdateSellerProfileDto,
  ) {
    return this.usersService.updateSellerProfile(req.user.id, updateDto);
  }

  // SHIPPER
  @UseGuards(JwtAuthGuard)
  @Get('shipper/profile')
  async getMyShipperProfile(@Request() req) {
    return this.usersService.getShipperProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('shipper/profile')
  async updateShipperProfile(
    @Request() req,
    @Body() updateDto: UpdateShipperProfileDto,
  ) {
    return this.usersService.updateShipperProfile(req.user.id, updateDto);
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

  // ADMIN

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard) // Nhớ check quyền Admin ở đây
  @Roles(UserRole.ADMIN)
  async getStats() {
    return await this.usersService.getUserStats();
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string) {
    return await this.usersService.deactivate(+id);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async activate(@Param('id') id: string) {
    return await this.usersService.activate(+id);
  }
}
