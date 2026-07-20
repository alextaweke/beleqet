// backend/src/modules/telegram/telegram.module.ts
import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TelegramService],
  controllers: [TelegramController],
  exports: [TelegramService], // ✅ Ensure this is exported
})
export class TelegramModule {}
