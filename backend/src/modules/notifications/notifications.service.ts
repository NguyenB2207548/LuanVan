import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
    ) { }

    // ----------------------------------------------------------------
    // INTERNAL: Tạo thông báo — dùng trong OrdersService
    // ----------------------------------------------------------------
    async create(dto: {
        recipientId: number;
        type: NotificationType;
        title: string;
        body: string;
        orderId?: number;
    }): Promise<Notification> {
        const notification = this.notificationRepo.create({
            recipientId: dto.recipientId,
            type: dto.type,
            title: dto.title,
            body: dto.body,
            orderId: dto.orderId ?? null,
        });
        return this.notificationRepo.save(notification);
    }

    // Tạo nhiều thông báo cùng lúc (ví dụ: 1 đơn có nhiều seller)
    async createMany(
        dtos: {
            recipientId: number;
            type: NotificationType;
            title: string;
            body: string;
            orderId?: number;
        }[],
    ): Promise<void> {
        const notifications = dtos.map((dto) =>
            this.notificationRepo.create({
                recipientId: dto.recipientId,
                type: dto.type,
                title: dto.title,
                body: dto.body,
                orderId: dto.orderId ?? null,
            }),
        );
        await this.notificationRepo.save(notifications);
    }

    // ----------------------------------------------------------------
    // API: Lấy danh sách thông báo của user đang đăng nhập
    // ----------------------------------------------------------------
    async getMyNotifications(
        userId: number,
        page: number = 1,
        limit: number = 20,
    ) {
        const [items, total] = await this.notificationRepo.findAndCount({
            where: { recipientId: userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data: items,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
                unreadCount: await this.getUnreadCount(userId),
            },
        };
    }

    // ----------------------------------------------------------------
    // API: Số thông báo chưa đọc (dùng cho badge trên bell icon)
    // ----------------------------------------------------------------
    async getUnreadCount(userId: number): Promise<number> {
        return this.notificationRepo.count({
            where: { recipientId: userId, isRead: false },
        });
    }

    // ----------------------------------------------------------------
    // API: Đánh dấu 1 thông báo đã đọc
    // ----------------------------------------------------------------
    async markAsRead(notificationId: number, userId: number): Promise<void> {
        await this.notificationRepo.update(
            { id: notificationId, recipientId: userId },
            { isRead: true, readAt: new Date() },
        );
    }

    // ----------------------------------------------------------------
    // API: Đánh dấu tất cả đã đọc
    // ----------------------------------------------------------------
    async markAllAsRead(userId: number): Promise<void> {
        await this.notificationRepo.update(
            { recipientId: userId, isRead: false },
            { isRead: true, readAt: new Date() },
        );
    }

    // ----------------------------------------------------------------
    // API: Xóa 1 thông báo
    // ----------------------------------------------------------------
    async deleteOne(notificationId: number, userId: number): Promise<void> {
        await this.notificationRepo.delete({
            id: notificationId,
            recipientId: userId,
        });
    }

    async createWithManager(
        manager: EntityManager,
        dto: {
            recipientId: number;
            type: NotificationType;
            title: string;
            body: string;
            orderId?: number;
        },
    ): Promise<void> {
        const notification = manager.create(Notification, {
            recipientId: dto.recipientId,
            type: dto.type,
            title: dto.title,
            body: dto.body,
            orderId: dto.orderId ?? null,
        });
        await manager.save(Notification, notification);
    }
}