import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { EscrowService } from './escrow.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';
import { WebhookPayloadDto } from './dto'; // ✅ Import DTO

@ApiTags('escrow')
@Controller('escrow')
export class EscrowController {
  private readonly logger = new Logger(EscrowController.name);

  constructor(
    private readonly svc: EscrowService,
    private readonly config: ConfigService,
  ) {}

  @Post('initiate/:gigId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async initiate(@Param('gigId') gigId: string, @CurrentUser() u: CurrentUserPayload) {
    try {
      return await this.svc.initiate(u.userId, gigId);
    } catch (error: any) {
      if (error.message?.includes('already has funded escrow')) {
        throw new BadRequestException('This gig already has funded escrow.');
      }
      if (error.message?.includes('Unique constraint')) {
        throw new BadRequestException('An escrow transaction already exists for this gig.');
      }
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getEscrow(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) {
    return this.svc.getEscrowById(id, u.userId);
  }

  @Get('gig/:gigId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getEscrowByGig(@Param('gigId') gigId: string, @CurrentUser() u: CurrentUserPayload) {
    return this.svc.getEscrowByGig(gigId, u.userId);
  }

  /** Webhook endpoint — verified via Chapa signature header */
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Body() payload: WebhookPayloadDto, // ✅ Use DTO
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('chapa-signature') chapaSignature?: string,
    @Headers('x-chapa-signature') xChapaSignature?: string,
  ) {
    this.logger.log(`📨 Webhook received: ${JSON.stringify(payload)}`);
    this.logger.log(`📨 Signature: ${chapaSignature || xChapaSignature}`);

    const signature = chapaSignature || xChapaSignature;
    const secret = this.config.get<string>('CHAPA_WEBHOOK_SECRET');
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';

    if (!isProduction) {
      this.logger.log('🔓 Development mode - skipping signature verification');
      return this.svc.handleWebhook(payload);
    }

    if (!secret || !req.rawBody || !signature) {
      throw new UnauthorizedException(
        'Webhook signature verification failed: missing required components',
      );
    }

    const hash = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');

    if (hash !== signature) {
      this.logger.error(`❌ Invalid signature. Expected: ${hash}, Got: ${signature}`);
      throw new UnauthorizedException('Invalid Webhook Signature');
    }

    this.logger.log('✅ Webhook signature verified successfully');
    return this.svc.handleWebhook(payload);
  }

  @Post('milestones/:id/release')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  release(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) {
    return this.svc.releaseMilestone(id, u.userId);
  }
}
