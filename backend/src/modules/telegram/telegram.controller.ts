// backend/src/modules/telegram/telegram.controller.ts
import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { TelegramService } from './telegram.service';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly svc: TelegramService) {}

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect Telegram to user account' })
  @ApiResponse({ status: 200, description: 'Telegram connected successfully' })
  async connectTelegram(
    @CurrentUser() user: CurrentUserPayload,
    @Body('telegramId') telegramId: string,
  ) {
    const success = await this.svc.connectTelegram(user.userId, telegramId);
    return {
      success,
      message: success ? 'Telegram connected successfully' : 'Failed to connect Telegram',
    };
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Telegram from user account' })
  @ApiResponse({ status: 200, description: 'Telegram disconnected successfully' })
  async disconnectTelegram(@CurrentUser() user: CurrentUserPayload) {
    const success = await this.svc.disconnectTelegram(user.userId);
    return {
      success,
      message: success ? 'Telegram disconnected successfully' : 'Failed to disconnect Telegram',
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Telegram connection status' })
  @ApiResponse({ status: 200, description: 'Telegram status' })
  async getStatus(@CurrentUser() user: CurrentUserPayload) {
    const telegramId = await this.svc.getUserTelegramId(user.userId);
    const botStatus = await this.svc.getBotStatus();
    return {
      connected: !!telegramId,
      telegramId,
      botRunning: botStatus.running,
      botUsername: botStatus.username,
    };
  }

  @Get('bot/status')
  @ApiOperation({ summary: 'Get bot status (public)' })
  @ApiResponse({ status: 200, description: 'Bot status' })
  async getBotStatus() {
    return this.svc.getBotStatus();
  }
}
