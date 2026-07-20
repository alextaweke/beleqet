// backend/src/modules/telegram/telegram.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot!: Telegraf;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (token && token !== 'your_bot_token_here') {
      this.bot = new Telegraf(token);
    }
  }

  async onModuleInit() {
    if (!this.bot) {
      this.logger.warn('Valid TELEGRAM_BOT_TOKEN not provided. Telegram bot listener disabled.');
      return;
    }

    // ── Commands ──────────────────────────────────────────────────────

    // /start - Welcome message
    this.bot.command('start', async (ctx) => {
      const telegramId = String(ctx.from.id);
      const firstName = ctx.from.first_name || 'User';

      // Check if user exists in database
      const user = await this.prisma.user.findFirst({
        where: { telegramId },
      });

      let message = `👋 Welcome to Beleqet, ${firstName}!\n\n`;

      if (user) {
        message += `✅ Your account (${user.email}) is already connected to this Telegram ID.\n\n`;
        message += `You will receive notifications for:\n`;
        message += `📋 Job applications\n`;
        message += `💼 Freelance bids\n`;
        message += `📝 Contract updates\n`;
        message += `💰 Payment notifications\n`;
        message += `💬 New messages\n\n`;
        message += `To manage your notifications, visit your profile settings.`;
      } else {
        message += `🔑 Your Telegram ID is: \`${telegramId}\`\n\n`;
        message += `To connect this Telegram account to your Beleqet profile:\n`;
        message += `1. Go to your profile settings on Beleqet\n`;
        message += `2. Paste this ID: \`${telegramId}\`\n`;
        message += `3. Save your settings\n\n`;
        message += `📌 Once connected, you'll receive instant notifications!`;
      }

      await ctx.reply(message, { parse_mode: 'Markdown' });
      this.logger.log(`Telegram /start by ${telegramId} (${firstName})`);
    });

    // /help - Help message
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        `📖 *Beleqet Telegram Bot Help*\n\n` +
          `🔹 */start* - Welcome message and your Telegram ID\n` +
          `🔹 */help* - Show this help message\n` +
          `🔹 */profile* - Check your connected account\n` +
          `🔹 */notifications* - Manage notification preferences\n` +
          `🔹 */unsubscribe* - Stop all notifications\n\n` +
          `💡 Visit beleqet.com for more features!`,
        { parse_mode: 'Markdown' },
      );
    });

    // /profile - Check connected account
    this.bot.command('profile', async (ctx) => {
      const telegramId = String(ctx.from.id);
      const user = await this.prisma.user.findFirst({
        where: { telegramId },
        select: {
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      if (user) {
        await ctx.reply(
          `👤 *Your Profile*\n\n` +
            `Name: ${user.firstName} ${user.lastName}\n` +
            `Email: ${user.email}\n` +
            `Role: ${user.role}\n` +
            `Status: ✅ Connected\n\n` +
            `You will receive notifications here.`,
          { parse_mode: 'Markdown' },
        );
      } else {
        const telegramId = String(ctx.from.id);
        await ctx.reply(
          `❌ No Beleqet account found for this Telegram ID.\n\n` +
            `Please connect your account by adding this ID in your profile:\n` +
            `\`${telegramId}\``,
          { parse_mode: 'Markdown' },
        );
      }
    });

    // /notifications - Notification preferences
    this.bot.command('notifications', async (ctx) => {
      const telegramId = String(ctx.from.id);
      const user = await this.prisma.user.findFirst({
        where: { telegramId },
      });

      if (!user) {
        await ctx.reply(
          `❌ Please connect your Beleqet account first.\n` + `Use /start to get your Telegram ID.`,
        );
        return;
      }

      // Get notification count
      const notifications = await this.prisma.notification.count({
        where: { userId: user.id, channel: 'TELEGRAM' },
      });

      await ctx.reply(
        `🔔 *Notification Settings*\n\n` +
          `📊 Total notifications: ${notifications}\n` +
          `📱 Channel: Telegram\n` +
          `✅ Status: Active\n\n` +
          `To manage preferences, visit your profile settings.`,
        { parse_mode: 'Markdown' },
      );
    });

    // /unsubscribe - Stop notifications
    this.bot.command('unsubscribe', async (ctx) => {
      const telegramId = String(ctx.from.id);

      // Remove telegram ID from user
      await this.prisma.user.updateMany({
        where: { telegramId },
        data: { telegramId: null },
      });

      await ctx.reply(
        `✅ You have been unsubscribed from Beleqet notifications.\n\n` +
          `You will no longer receive updates here.\n` +
          `To reconnect, use /start and add your ID in profile settings.`,
      );
      this.logger.log(`Telegram unsubscribe: ${telegramId}`);
    });

    // ── Error Handling ────────────────────────────────────────────────

    this.bot.catch((err, ctx) => {
      this.logger.error(`Telegram error for ${ctx.updateType}:`, err);
      ctx.reply('⚠️ Something went wrong. Please try again later.');
    });

    // ── Start Bot ─────────────────────────────────────────────────────

    try {
      // Use webhook or polling based on environment
      const isProduction = this.config.get('NODE_ENV') === 'production';

      if (isProduction) {
        // Webhook mode for production
        const webhookUrl = this.config.get<string>('TELEGRAM_WEBHOOK_URL');
        if (webhookUrl) {
          await this.bot.telegram.setWebhook(webhookUrl);
          this.logger.log(`Telegram webhook set to: ${webhookUrl}`);
        }
      }

      // Start bot
      this.bot.launch();
      this.logger.log('Telegram bot started successfully.');

      // Get bot info
      const botInfo = await this.bot.telegram.getMe();
      this.logger.log(`Bot: @${botInfo.username}`);
    } catch (err) {
      this.logger.error('Failed to start Telegram bot:', (err as Error).message);
    }
  }

  onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('SIGINT');
      this.logger.log('Telegram bot stopped.');
    }
  }

  // ── Send Message to User ─────────────────────────────────────────────

  async sendMessage(
    telegramId: string,
    message: string,
    parseMode: 'Markdown' | 'HTML' = 'Markdown',
  ): Promise<boolean> {
    if (!this.bot) {
      this.logger.warn('Telegram bot not configured, cannot send message');
      return false;
    }

    try {
      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: parseMode,
        link_preview_options: { is_disabled: true },
      });
      this.logger.debug(`Telegram message sent to ${telegramId}`);
      return true;
    } catch (error) {
      // Check if user blocked the bot
      if ((error as Error).message?.includes('bot was blocked by the user')) {
        this.logger.warn(`User ${telegramId} blocked the bot`);
        // Optionally: mark user as inactive
        await this.prisma.user.updateMany({
          where: { telegramId },
          data: { telegramId: null },
        });
      } else {
        this.logger.error(
          `Failed to send Telegram message to ${telegramId}:`,
          (error as Error).message,
        );
      }
      return false;
    }
  }
  // ── Send Notification Helper ─────────────────────────────────────────

  async sendNotification(userId: string, title: string, body: string, metadata?: any) {
    try {
      // Get user's telegram ID
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { telegramId: true, firstName: true },
      });

      if (!user?.telegramId) {
        this.logger.debug(`User ${userId} has no telegram ID`);
        return false;
      }

      const message = this.formatNotificationMessage(title, body, metadata);
      const success = await this.sendMessage(user.telegramId, message);

      if (success) {
        // Log notification
        await this.prisma.notification.create({
          data: {
            userId,
            channel: 'TELEGRAM',
            type: metadata?.type || 'general',
            title,
            body,
            metadata: metadata || {},
          },
        });
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to send notification to ${userId}:`, (error as Error).message);
      return false;
    }
  }

  // ── Format Notification Message ──────────────────────────────────────

  private formatNotificationMessage(title: string, body: string, metadata?: any): string {
    let message = `📢 *${title}*\n\n${body}`;

    if (metadata) {
      // Add metadata if available
      if (metadata.link) {
        message += `\n\n🔗 [View Details](${metadata.link})`;
      }
      if (metadata.amount) {
        message += `\n💰 Amount: ETB ${metadata.amount.toLocaleString()}`;
      }
      if (metadata.status) {
        message += `\n📊 Status: ${metadata.status}`;
      }
    }

    message += '\n\n---\nBeleqet Job Platform';
    return message;
  }

  // ── Get User Telegram ID ─────────────────────────────────────────────

  async getUserTelegramId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true },
    });
    return user?.telegramId || null;
  }

  // ── Connect Telegram to User ─────────────────────────────────────────

  async connectTelegram(userId: string, telegramId: string): Promise<boolean> {
    try {
      // Check if telegram ID is already used
      const existing = await this.prisma.user.findFirst({
        where: { telegramId },
      });

      if (existing && existing.id !== userId) {
        this.logger.warn(`Telegram ID ${telegramId} already in use by another user`);
        return false;
      }

      // Update user
      await this.prisma.user.update({
        where: { id: userId },
        data: { telegramId },
      });

      // Send welcome message
      await this.sendMessage(
        telegramId,
        `✅ Your Beleqet account has been connected!\n\n` +
          `You will now receive notifications here.\n` +
          `Use /help to see available commands.`,
      );

      this.logger.log(`Telegram ${telegramId} connected to user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to connect telegram for ${userId}:`, (error as Error).message);
      return false;
    }
  }

  // ── Disconnect Telegram ──────────────────────────────────────────────

  async disconnectTelegram(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { telegramId: true },
      });

      if (user?.telegramId) {
        await this.sendMessage(
          user.telegramId,
          `🔴 Your Beleqet account has been disconnected.\n\n` +
            `You will no longer receive notifications here.\n` +
            `To reconnect, add your ID in profile settings.`,
        );
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { telegramId: null },
      });

      this.logger.log(`Telegram disconnected for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to disconnect telegram for ${userId}:`, (error as Error).message);
      return false;
    }
  }

  // ── Get Bot Status ────────────────────────────────────────────────────

  async getBotStatus(): Promise<{ running: boolean; username?: string }> {
    if (!this.bot) {
      return { running: false };
    }

    try {
      const botInfo = await this.bot.telegram.getMe();
      return {
        running: true,
        username: botInfo.username,
      };
    } catch {
      return { running: false };
    }
  }
}
