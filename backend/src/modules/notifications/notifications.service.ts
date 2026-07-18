// backend/src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../queues/queues.constants';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private readonly notificationsQueue: Queue,
  ) {}

  // ── Send Notification ──────────────────────────────────────────────

  async sendNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    metadata?: any;
    channels?: ('IN_APP' | 'TELEGRAM' | 'EMAIL')[];
  }) {
    const { userId, type, title, body, metadata, channels = ['IN_APP'] } = data;

    // Send in-app notification
    if (channels.includes('IN_APP')) {
      await this.notificationsQueue.add(NOTIFICATION_JOBS.SEND_IN_APP, {
        userId,
        type,
        title,
        body,
        metadata,
      });
    }

    // Send Telegram notification
    if (channels.includes('TELEGRAM')) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { telegramId: true },
      });
      if (user?.telegramId) {
        const message = `📢 *${title}*\n\n${body}`;
        await this.notificationsQueue.add(NOTIFICATION_JOBS.SEND_TELEGRAM, {
          telegramId: user.telegramId,
          message,
        });
      }
    }

    // Send Email notification
    if (channels.includes('EMAIL')) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });
      if (user?.email) {
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #22c55e; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
              .content { padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>${title}</h2>
              </div>
              <div class="content">
                <p>Hello ${user.firstName || 'User'},</p>
                <p>${body}</p>
                <p>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/notifications" class="button">View Notifications</a>
                </p>
                <p style="color: #999; font-size: 12px;">Beleqet Job Platform</p>
              </div>
            </div>
          </body>
          </html>
        `;
        await this.notificationsQueue.add(NOTIFICATION_JOBS.SEND_EMAIL, {
          to: user.email,
          subject: title,
          html,
        });
      }
    }

    this.logger.debug(`Notification sent to ${userId}: ${title}`);
    return { success: true, userId, type, title };
  }

  // ── Get User Notifications ─────────────────────────────────────────

  async getUserNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      read?: boolean;
      type?: string;
    },
  ) {
    const { limit = 50, offset = 0, read, type } = options || {};

    const where: any = { userId };
    if (read !== undefined) where.read = read;
    if (type) where.type = type;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    return {
      items,
      total,
      unreadCount,
      hasMore: total > offset + limit,
    };
  }

  // ── Mark as Read ────────────────────────────────────────────────────

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  // ── Delete Notification ────────────────────────────────────────────

  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  // ── Get Notification by ID ─────────────────────────────────────────

  async getNotificationById(notificationId: string, userId: string) {
    return this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
  }
}
