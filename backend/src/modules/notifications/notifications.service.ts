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

    const results = [];

    // Send in-app notification
    if (channels.includes('IN_APP')) {
      try {
        await this.notificationsQueue.add(NOTIFICATION_JOBS.SEND_IN_APP, {
          userId,
          type,
          title,
          body,
          metadata,
        });
        results.push({ channel: 'IN_APP', status: 'queued' });
      } catch (error) {
        this.logger.error(`Failed to queue IN_APP notification: ${error as Error}.message}`);
        results.push({ channel: 'IN_APP', status: 'failed', error: (error as Error).message });
      }
    }

    // Send Telegram notification
    if (channels.includes('TELEGRAM')) {
      try {
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
          results.push({ channel: 'TELEGRAM', status: 'queued' });
        } else {
          this.logger.warn(`User ${userId} has no telegramId`);
          results.push({ channel: 'TELEGRAM', status: 'skipped', reason: 'No telegramId' });
        }
      } catch (error) {
        this.logger.error(`Failed to queue TELEGRAM notification: ${error as Error}.message}`);
        results.push({ channel: 'TELEGRAM', status: 'failed', error: (error as Error).message });
      }
    }

    // Send Email notification
    if (channels.includes('EMAIL')) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true },
        });
        if (user?.email) {
          const html = this.buildEmailTemplate(title, body, user.firstName);
          await this.notificationsQueue.add(NOTIFICATION_JOBS.SEND_EMAIL, {
            to: user.email,
            subject: title,
            html,
          });
          results.push({ channel: 'EMAIL', status: 'queued' });
        } else {
          this.logger.warn(`User ${userId} has no email`);
          results.push({ channel: 'EMAIL', status: 'skipped', reason: 'No email' });
        }
      } catch (error) {
        this.logger.error(`Failed to queue EMAIL notification: ${error as Error}.message}`);
        results.push({ channel: 'EMAIL', status: 'failed', error: (error as Error).message });
      }
    }

    this.logger.debug(`Notification sent to ${userId}: ${title} (${results.length} channels)`);
    return { success: true, userId, type, title, results };
  }

  private buildEmailTemplate(title: string, body: string, firstName?: string): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #22c55e; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; }
          .footer { color: #999; font-size: 12px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">${title}</h2>
          </div>
          <div class="content">
            <p>Hello ${firstName || 'User'},</p>
            <p>${body}</p>
            <p style="text-align: center;">
              <a href="${frontendUrl}/notifications" class="button">View Notifications</a>
            </p>
            <div class="footer">
              Beleqet Job Platform
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
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
