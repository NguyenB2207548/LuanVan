import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    ParseIntPipe,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    // GET /notifications?page=1&limit=20
    @Get()
    getMyNotifications(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.notificationsService.getMyNotifications(
            req.user.id,
            page ? +page : 1,
            limit ? +limit : 20,
        );
    }

    // GET /notifications/unread-count
    // Đặt TRÊN :id để không bị nhầm thành Param
    @Get('unread-count')
    getUnreadCount(@Request() req) {
        return this.notificationsService.getUnreadCount(req.user.id);
    }

    // PATCH /notifications/read-all
    @Patch('read-all')
    markAllAsRead(@Request() req) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }

    // PATCH /notifications/:id/read
    @Patch(':id/read')
    markAsRead(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
    ) {
        return this.notificationsService.markAsRead(id, req.user.id);
    }

    // DELETE /notifications/:id
    @Delete(':id')
    deleteOne(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
    ) {
        return this.notificationsService.deleteOne(id, req.user.id);
    }
}