// backend/src/modules/telegram/telegram.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf | null = null;
  private readonly logger = new Logger(TelegramService.name);
  private isBotStarted = false;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    // ✅ Better validation - check if token is valid format
    if (token && token !== 'your_bot_token_here' && token.length > 10) {
      try {
        this.bot = new Telegraf(token);
        this.logger.log('Telegram bot initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Telegram bot:', (error as Error).message);
        this.bot = null;
      }
    } else {
      this.logger.warn('Valid TELEGRAM_BOT_TOKEN not provided. Telegram features disabled.');
    }
  }

  async onModuleInit() {
    // ✅ Only try to start bot if token is configured
    if (!this.bot) {
      this.logger.warn('⚠️ Telegram bot not configured. Skipping bot startup.');
      return;
    }

    try {
      // ✅ Set up commands
      this.setupCommands();

      // ✅ Try to start the bot with a timeout
      await this.startBotWithTimeout();

      // ✅ Get bot info to verify it's working
      try {
        const botInfo = await this.bot.telegram.getMe();
        this.logger.log(`✅ Telegram bot @${botInfo.username} started successfully`);
      } catch (error) {
        this.logger.error(`❌ Failed to get bot info: ${(error as Error).message}`);
        this.logger.warn('Bot may not be running properly. Check your token.');
      }
    } catch (error) {
      this.logger.error(`❌ Failed to start Telegram bot: ${(error as Error).message}`);
      this.logger.warn('Telegram features will be disabled. Check your TELEGRAM_BOT_TOKEN.');
      this.bot = null;
    }
  }

  private async startBotWithTimeout() {
    if (!this.bot) return;

    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Bot startup timeout after 10s')), 10000);
    });

    try {
      await Promise.race([this.bot.launch(), timeout]);
      this.isBotStarted = true;
      this.logger.log('Telegram bot launched successfully');
    } catch (error) {
      this.logger.error(`Failed to launch bot: ${(error as Error).message}`);
      throw error;
    }
  }

  private setupCommands() {
    if (!this.bot) return;

    // ── /start - Welcome message ──
    this.bot.command('start', async (ctx) => {
      try {
        const telegramId = String(ctx.from.id);
        const firstName = ctx.from.first_name || 'User';

        const user = await this.prisma.user.findFirst({
          where: { telegramId },
        });

        let message = `👋 Welcome to Beleqet, ${firstName}!\n\n`;

        if (user) {
          message += `✅ Your account (${user.email}) is already connected.\n\n`;
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
        this.logger.debug(`Telegram /start by ${telegramId} (${firstName})`);
      } catch (error) {
        this.logger.error(`Error handling /start: ${(error as Error).message}`);
        await ctx.reply('⚠️ Something went wrong. Please try again later.');
      }
    });

    // ── /help - Help message ──
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

    // ── /profile - Check connected account ──
    this.bot.command('profile', async (ctx) => {
      try {
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
          await ctx.reply(
            `❌ No Beleqet account found for this Telegram ID.\n\n` +
              `Please connect your account by adding this ID in your profile:\n` +
              `\`${telegramId}\``,
            { parse_mode: 'Markdown' },
          );
        }
      } catch (error) {
        this.logger.error(`Error handling /profile: ${(error as Error).message}`);
        await ctx.reply('⚠️ Something went wrong. Please try again later.');
      }
    });

    // ── /unsubscribe - Stop notifications ──
    this.bot.command('unsubscribe', async (ctx) => {
      try {
        const telegramId = String(ctx.from.id);
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
      } catch (error) {
        this.logger.error(`Error handling /unsubscribe: ${(error as Error).message}`);
        await ctx.reply('⚠️ Something went wrong. Please try again later.');
      }
    });

    // ── Error handling ──
    this.bot.catch((err, ctx) => {
      this.logger.error(`Telegram error for ${ctx.updateType}:`, (err as Error).message);
      ctx.reply('⚠️ Something went wrong. Please try again later.').catch(() => {});
    });
  }

  onModuleDestroy() {
    if (this.bot) {
      try {
        this.bot.stop('SIGINT');
        this.logger.log('Telegram bot stopped.');
      } catch (error) {
        this.logger.error(`Error stopping bot: ${(error as Error).message}`);
      }
    }
  }

  // ── Send Message to User ──
  async sendMessage(
    telegramId: string,
    message: string,
    parseMode: 'Markdown' | 'HTML' = 'Markdown',
  ): Promise<boolean> {
    if (!this.bot || !this.isBotStarted) {
      this.logger.warn('Telegram bot not started, cannot send message');
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
        this.logger.warn(`User ${telegramId} blocked the bot, disconnecting`);
        await this.prisma.user
          .updateMany({
            where: { telegramId },
            data: { telegramId: null },
          })
          .catch(() => {});
      } else {
        this.logger.error(
          `Failed to send Telegram message to ${telegramId}:`,
          (error as Error).message,
        );
      }
      return false;
    }
  }

  // ── Send Notification Helper ──
  async sendNotification(
    userId: string,
    title: string,
    body: string,
    metadata?: any,
  ): Promise<boolean> {
    if (!this.isBotStarted) {
      this.logger.debug('Telegram bot not started, skipping notification');
      return false;
    }

    try {
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

  private formatNotificationMessage(title: string, body: string, metadata?: any): string {
    let message = `📢 *${title}*\n\n${body}`;

    if (metadata) {
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

  // ── Get User Telegram ID ──
  async getUserTelegramId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true },
    });
    return user?.telegramId || null;
  }

  // ── Connect Telegram ──
  async connectTelegram(userId: string, telegramId: string): Promise<boolean> {
    try {
      const existing = await this.prisma.user.findFirst({
        where: { telegramId },
      });

      if (existing && existing.id !== userId) {
        this.logger.warn(`Telegram ID ${telegramId} already in use`);
        return false;
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { telegramId },
      });

      // Send welcome message
      if (this.isBotStarted) {
        await this.sendMessage(
          telegramId,
          `✅ Your Beleqet account has been connected!\n\n` +
            `You will now receive notifications here.\n` +
            `Use /help to see available commands.`,
        );
      }

      this.logger.log(`Telegram ${telegramId} connected to user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to connect telegram for ${userId}:`, (error as Error).message);
      return false;
    }
  }

  // ── Disconnect Telegram ──
  async disconnectTelegram(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { telegramId: true },
      });

      if (user?.telegramId && this.isBotStarted) {
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

  // ── Get Bot Status ──
  async getBotStatus(): Promise<{ running: boolean; username?: string }> {
    if (!this.bot || !this.isBotStarted) {
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
