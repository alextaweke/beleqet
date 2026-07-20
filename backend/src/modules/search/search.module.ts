// backend/src/modules/search/search.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from '../queues/queues.constants';
import { SearchIndexProcessor } from './search-index.processor';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.SEARCH_INDEX }), PrismaModule],
  providers: [SearchIndexProcessor, SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
