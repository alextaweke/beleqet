// backend/src/modules/search/search-index.processor.ts
import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job as BullJob } from 'bull';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES } from '../queues/queues.constants';

interface IndexJobPayload {
  action: 'upsert' | 'delete';
  entityType: 'job' | 'freelance_job';
  entityId: string;
}

@Injectable()
@Processor(QUEUE_NAMES.SEARCH_INDEX)
export class SearchIndexProcessor {
  private readonly logger = new Logger(SearchIndexProcessor.name);
  private readonly client: Client;
  private readonly indexPrefix: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const node = this.config.get<string>('OPENSEARCH_URL') || 'http://localhost:9200';
    this.indexPrefix = this.config.get<string>('OPENSEARCH_INDEX_PREFIX') || 'beleqet';

    this.client = new Client({
      node,
      auth: {
        username: this.config.get<string>('OPENSEARCH_USERNAME') || 'admin',
        password: this.config.get<string>('OPENSEARCH_PASSWORD') || 'admin',
      },
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  // ── Index Job ──────────────────────────────────────────────────────

  @Process('index-job')
  async indexJob(job: BullJob<IndexJobPayload>) {
    const { action, entityType, entityId } = job.data;
    this.logger.debug(`[search-index] Processing ${action} for ${entityType}:${entityId}`);

    try {
      if (action === 'delete') {
        await this.deleteDocument(entityType, entityId);
        return;
      }

      if (entityType === 'job') {
        await this.indexJobDocument(entityId);
      } else if (entityType === 'freelance_job') {
        await this.indexFreelanceJobDocument(entityId);
      }
    } catch (error) {
      this.logger.error(`[search-index] Failed to index ${entityType}:${entityId}`, error);
      throw error; // Will trigger retry
    }
  }

  // ── Index Job Document ─────────────────────────────────────────────

  private async indexJobDocument(jobId: string) {
    const data = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        category: true,
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!data) {
      this.logger.warn(`[search-index] Job ${jobId} not found, skipping`);
      return;
    }

    const document = {
      id: data.id,
      title: data.title,
      description: data.description,
      requirements: data.requirements,
      location: data.location,
      type: data.type,
      category: data.category?.label,
      categorySlug: data.category?.slug,
      company: data.company?.name,
      companyId: data.companyId,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      currency: data.currency,
      experienceLevel: data.experienceLevel,
      status: data.status,
      featured: data.featured,
      urgent: data.urgent,
      tags: data.tags,
      applicationCount: data._count.applications,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deadline: data.deadline,
      filled: data.filled,
      // For search ranking
      boost: data.featured ? 2 : data.urgent ? 1.5 : 1,
    };

    await this.client.index({
      index: `${this.indexPrefix}_jobs`,
      id: jobId,
      body: document,
      refresh: true,
    });

    this.logger.debug(`[search-index] Indexed job:${jobId} "${data.title}"`);
  }

  // ── Index Freelance Job Document ──────────────────────────────────

  private async indexFreelanceJobDocument(gigId: string) {
    const data = await this.prisma.freelanceJob.findUnique({
      where: { id: gigId },
      include: {
        category: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { bids: true },
        },
      },
    });

    if (!data) {
      this.logger.warn(`[search-index] Freelance job ${gigId} not found, skipping`);
      return;
    }

    const document = {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category?.label,
      categorySlug: data.category?.slug,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      currency: data.currency,
      pricingType: data.pricingType,
      deadlineDays: data.deadlineDays,
      skills: data.skills,
      status: data.status,
      featured: data.featured,
      experienceLevel: data.experienceLevel,
      locationPreference: data.locationPreference,
      bidCount: data._count.bids,
      clientName: data.client ? `${data.client.firstName} ${data.client.lastName}` : null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // For search ranking
      boost: data.featured ? 2 : 1,
    };

    await this.client.index({
      index: `${this.indexPrefix}_freelance_jobs`,
      id: gigId,
      body: document,
      refresh: true,
    });

    this.logger.debug(`[search-index] Indexed freelance_job:${gigId} "${data.title}"`);
  }

  // ── Delete Document ────────────────────────────────────────────────

  private async deleteDocument(entityType: string, entityId: string) {
    const index =
      entityType === 'job' ? `${this.indexPrefix}_jobs` : `${this.indexPrefix}_freelance_jobs`;

    try {
      await this.client.delete({
        index,
        id: entityId,
        refresh: true,
      });
      this.logger.debug(`[search-index] Deleted ${entityType}:${entityId}`);
    } catch (error: unknown) {
      // Ignore if document doesn't exist
      const statusCode =
        typeof error === 'object' &&
        error !== null &&
        'meta' in error &&
        typeof (error as { meta?: { statusCode?: number } }).meta === 'object' &&
        (error as { meta?: { statusCode?: number } }).meta !== null
          ? (error as { meta?: { statusCode?: number } }).meta?.statusCode
          : undefined;

      if (statusCode !== 404) {
        throw error;
      }
      this.logger.debug(`[search-index] Document ${entityType}:${entityId} already deleted`);
    }
  }

  // ── Bulk Index (for initial sync) ─────────────────────────────────

  @Process('bulk-index')
  async bulkIndex(job: BullJob<{ entityType: 'job' | 'freelance_job'; batchSize?: number }>) {
    const { entityType, batchSize = 100 } = job.data;
    this.logger.log(`[search-index] Starting bulk index for ${entityType}`);

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const items = await this.getBatch(entityType, offset, batchSize);

      if (items.length === 0) {
        hasMore = false;
        break;
      }

      const index =
        entityType === 'job' ? `${this.indexPrefix}_jobs` : `${this.indexPrefix}_freelance_jobs`;

      const body = items.flatMap((item: any) => [
        { index: { _index: index, _id: item.id } },
        this.transformDocument(entityType, item),
      ]);

      await this.client.bulk({ body, refresh: true });
      this.logger.debug(`[search-index] Bulk indexed ${items.length} ${entityType} documents`);

      offset += batchSize;
    }

    this.logger.log(`[search-index] Bulk indexing complete for ${entityType}`);
  }

  private async getBatch(entityType: string, offset: number, limit: number) {
    if (entityType === 'job') {
      return this.prisma.job.findMany({
        where: { status: 'PUBLISHED' },
        include: { company: true, category: true },
        skip: offset,
        take: limit,
      });
    } else {
      return this.prisma.freelanceJob.findMany({
        where: { status: { in: ['OPEN', 'FUNDED'] } },
        include: { category: true },
        skip: offset,
        take: limit,
      });
    }
  }

  private transformDocument(entityType: string, data: any) {
    if (entityType === 'job') {
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        location: data.location,
        type: data.type,
        category: data.category?.label,
        company: data.company?.name,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: data.currency,
        featured: data.featured,
        createdAt: data.createdAt,
        boost: data.featured ? 2 : 1,
      };
    } else {
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category?.label,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        currency: data.currency,
        skills: data.skills,
        status: data.status,
        featured: data.featured,
        createdAt: data.createdAt,
        boost: data.featured ? 2 : 1,
      };
    }
  }

  // ── Error Handler ───────────────────────────────────────────────────

  @OnQueueFailed()
  onFailed(job: BullJob, error: Error) {
    this.logger.error(
      `[search-index] Job failed: [${job.name}] id=${job.id} attempt=${job.attemptsMade}`,
      error.stack,
    );
  }
}
