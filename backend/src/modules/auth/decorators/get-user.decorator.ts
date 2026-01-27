import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Nếu người dùng truyền vào tham số (ví dụ: @GetUser('userId')),
    // trả về chỉ trường đó. Nếu không, trả về cả object.
    return data ? user?.[data] : user;
  },
);
