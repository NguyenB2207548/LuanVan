import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException, // Import thêm lỗi Forbidden
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 1. Nếu API này không yêu cầu Role (không có decorator @Roles) thì cho qua
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // 2. Kiểm tra xem User có Role hợp lệ không
    const hasRole = requiredRoles.some((role) => user?.role === role);

    if (!hasRole) {
      // 3. THAY ĐỔI Ở ĐÂY: Thay vì trả về false, ta chủ động ném Exception kèm message
      throw new ForbiddenException(
        'Bạn không có quyền truy cập vào chức năng này',
      );
    }

    return true;
  }
}
