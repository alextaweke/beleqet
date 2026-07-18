// backend/src/modules/notifications/notifications.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../queues/queues.constants';
import * as nodemailer from 'nodemailer';

interface InAppPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: object;
}

interface TelegramPayload {
  telegramId: string;
  message: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATIONS)
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private readonly transporter!: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // Only create transporter if SMTP is configured
    const smtpHost = this.config.get<string>('SMTP_HOST');
    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.config.get<number>('SMTP_PORT') || 587,
        secure: this.config.get<boolean>('SMTP_SECURE') || false,
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  @Process(NOTIFICATION_JOBS.SEND_IN_APP)
  async sendInApp(job: Job<InAppPayload>) {
    const { userId, type, title, body, metadata } = job.data;
    if (!userId) {
      this.logger.warn('SEND_IN_APP job missing userId');
      return;
    }

    try {
      await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          channel: 'IN_APP',
          metadata: metadata as never,
        },
      });
      this.logger.debug(`✅ In-app notification sent to ${userId}: ${title}`);
    } catch (error) {
      this.logger.error(
        `Failed to send in-app notification to ${userId}: ${(error as Error).message}`,
      );
    }
  }

  @Process(NOTIFICATION_JOBS.SEND_TELEGRAM)
  async sendTelegram(job: Job<TelegramPayload>) {
    const { telegramId, message } = job.data;
    if (!telegramId) {
      this.logger.warn('SEND_TELEGRAM job missing telegramId');
      return;
    }

    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured');
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.warn(`Telegram API error: ${error}`);
      } else {
        this.logger.debug(`✅ Telegram notification sent to ${telegramId}`);
      }
    } catch (error) {
      this.logger.warn(`Telegram failed: ${(error as Error).message}`);
    }
  }

  @Process(NOTIFICATION_JOBS.SEND_EMAIL)
  async sendEmail(job: Job<EmailPayload>) {
    const { to, subject, html } = job.data;
    if (!to) {
      this.logger.warn('SEND_EMAIL job missing recipient');
      return;
    }

    if (!this.transporter) {
      this.logger.warn('SMTP not configured, skipping email');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.config.get<string>('EMAIL_FROM', 'Beleqet <noreply@beleqet.com>'),
        to,
        subject,
        html,
      });
      this.logger.debug(`✅ Email sent to ${to}: ${subject} (${info.messageId})`);
    } catch (error) {
      this.logger.warn(`Email failed for ${to}: ${(error as Error).message}`);
    }
  }
}
