// backend/src/modules/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Client } from '@opensearch-project/opensearch';
import { QUEUE_NAMES } from '../queues/queues.constants';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly client: Client;
  private readonly indexPrefix: string;

  constructor(
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_NAMES.SEARCH_INDEX) private readonly searchQueue: Queue,
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

  // ── Search Jobs ─────────────────────────────────────────────────────

  async searchJobs(
    query: string,
    filters?: {
      location?: string;
      type?: string;
      category?: string;
      minSalary?: number;
      maxSalary?: number;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const from = (page - 1) * limit;

    const must: any[] = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^3', 'description', 'requirements', 'company^2', 'category^2', 'tags'],
          fuzziness: 'AUTO',
        },
      });
    }

    if (filters?.location) {
      must.push({
        match: {
          location: {
            query: filters.location,
            fuzziness: 'AUTO',
          },
        },
      });
    }

    if (filters?.type) {
      must.push({ term: { type: filters.type } });
    }

    if (filters?.category) {
      must.push({ term: { categorySlug: filters.category } });
    }

    if (filters?.minSalary) {
      must.push({ range: { salaryMax: { gte: filters.minSalary } } });
    }

    if (filters?.maxSalary) {
      must.push({ range: { salaryMin: { lte: filters.maxSalary } } });
    }

    // Always show only published and unfilled jobs
    must.push({ term: { status: 'PUBLISHED' } });
    must.push({ term: { filled: false } });

    const response = await this.client.search({
      index: `${this.indexPrefix}_jobs`,
      body: {
        query: {
          bool: { must },
        },
        from,
        size: limit,
        sort: [{ boost: 'desc' }, { featured: 'desc' }, { createdAt: 'desc' }],
        aggs: {
          categories: {
            terms: { field: 'category', size: 20 },
          },
          locations: {
            terms: { field: 'location', size: 20 },
          },
          types: {
            terms: { field: 'type', size: 10 },
          },
          salary_ranges: {
            range: {
              field: 'salaryMax',
              ranges: [
                { to: 10000 },
                { from: 10000, to: 20000 },
                { from: 20000, to: 40000 },
                { from: 40000 },
              ],
            },
          },
        },
      },
    });

    const hits = response.body?.hits;
    const aggregations = response.body?.aggregations;
    const total = typeof hits?.total === 'number' ? hits.total : (hits?.total?.value ?? 0);
    const searchHits = hits?.hits ?? [];

    return {
      items: searchHits.map((hit: any) => ({
        ...hit._source,
        id: hit._id,
        score: hit._score,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      aggregations: {
        categories: (aggregations?.categories as any)?.buckets || [],
        locations: (aggregations?.locations as any)?.buckets || [],
        types: (aggregations?.types as any)?.buckets || [],
        salaryRanges: (aggregations?.salary_ranges as any)?.buckets || [],
      },
    };
  }

  // ── Search Freelance Jobs ──────────────────────────────────────────

  async searchFreelanceJobs(
    query: string,
    filters?: {
      category?: string;
      minBudget?: number;
      maxBudget?: number;
      skills?: string[];
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const from = (page - 1) * limit;

    const must: any[] = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^3', 'description', 'skills^2', 'category^2'],
          fuzziness: 'AUTO',
        },
      });
    }

    if (filters?.category) {
      must.push({ term: { categorySlug: filters.category } });
    }

    if (filters?.minBudget) {
      must.push({ range: { budgetMax: { gte: filters.minBudget } } });
    }

    if (filters?.maxBudget) {
      must.push({ range: { budgetMin: { lte: filters.maxBudget } } });
    }

    if (filters?.skills && filters.skills.length > 0) {
      must.push({
        terms: { skills: filters.skills },
      });
    }

    if (filters?.status) {
      must.push({ term: { status: filters.status } });
    } else {
      must.push({ terms: { status: ['OPEN', 'FUNDED'] } });
    }

    const response = await this.client.search({
      index: `${this.indexPrefix}_freelance_jobs`,
      body: {
        query: {
          bool: { must },
        },
        from,
        size: limit,
        sort: [{ boost: 'desc' }, { featured: 'desc' }, { createdAt: 'desc' }],
        aggs: {
          categories: {
            terms: { field: 'category', size: 20 },
          },
          skills: {
            terms: { field: 'skills', size: 30 },
          },
          statuses: {
            terms: { field: 'status', size: 10 },
          },
        },
      },
    });

    const hits = response.body.hits;
    const aggregations = response.body.aggregations;
    const total = typeof hits.total === 'number' ? hits.total : (hits.total?.value ?? 0);

    return {
      items: hits.hits.map((hit: any) => ({
        ...hit._source,
        id: hit._id,
        score: hit._score,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      aggregations: {
        categories: (aggregations?.categories as any)?.buckets || [],
        skills: (aggregations?.skills as any)?.buckets || [],
        statuses: (aggregations?.statuses as any)?.buckets || [],
      },
    };
  }

  // ── Suggest Auto-Complete ──────────────────────────────────────────

  async autocomplete(query: string, type: 'jobs' | 'freelance' = 'jobs') {
    const index =
      type === 'jobs' ? `${this.indexPrefix}_jobs` : `${this.indexPrefix}_freelance_jobs`;

    const fields =
      type === 'jobs'
        ? ['title.suggest^3', 'description.suggest', 'company.suggest^2']
        : ['title.suggest^3', 'description.suggest', 'skills.suggest^2'];

    const response = await this.client.search({
      index,
      body: {
        query: {
          multi_match: {
            query,
            fields,
            type: 'bool_prefix',
          },
        },
        size: 10,
        _source: ['id', 'title', 'category'],
      },
    });

    return response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      title: hit._source.title,
      category: hit._source.category,
      score: hit._score,
    }));
  }

  // ── Queue Document for Indexing ────────────────────────────────────

  async queueIndex(
    entityType: 'job' | 'freelance_job',
    entityId: string,
    action: 'upsert' | 'delete' = 'upsert',
  ) {
    await this.searchQueue.add('index-job', {
      action,
      entityType,
      entityId,
    });
  }

  // ── Bulk Index ──────────────────────────────────────────────────────

  async bulkIndex(entityType: 'job' | 'freelance_job', batchSize: number = 100) {
    await this.searchQueue.add('bulk-index', {
      entityType,
      batchSize,
    });
  }

  // ── Check Index Health ─────────────────────────────────────────────

  async healthCheck() {
    try {
      const response = await this.client.cluster.health({});
      return {
        status: 'healthy',
        cluster: response.body,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: (error as Error).message,
      };
    }
  }
}
