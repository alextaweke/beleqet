// backend/src/scripts/index-existing-data.ts
import { PrismaClient } from '@prisma/client';
import { Client } from '@opensearch-project/opensearch';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

const opensearch = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USERNAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || 'admin',
  },
  ssl: {
    rejectUnauthorized: false,
  },
});

const INDEX_PREFIX = process.env.OPENSEARCH_INDEX_PREFIX || 'beleqet';

async function indexJobs() {
  console.log('📝 Indexing jobs...');

  const jobs = await prisma.job.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      company: true,
      category: true,
    },
  });

  console.log(`Found ${jobs.length} jobs to index`);

  let indexed = 0;
  for (const job of jobs) {
    try {
      const document = {
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        location: job.location,
        type: job.type,
        category: job.category?.label,
        categorySlug: job.category?.slug,
        company: job.company?.name,
        companyId: job.companyId,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.currency,
        experienceLevel: job.experienceLevel,
        status: job.status,
        featured: job.featured,
        urgent: job.urgent,
        tags: job.tags,
        applicationCount: await prisma.application.count({ where: { jobId: job.id } }),
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        deadline: job.deadline,
        filled: job.filled,
        boost: job.featured ? 2 : job.urgent ? 1.5 : 1,
      };

      await opensearch.index({
        index: `${INDEX_PREFIX}_jobs`,
        id: job.id,
        body: document,
        refresh: true,
      });

      indexed++;
      if (indexed % 10 === 0) {
        console.log(`  Indexed ${indexed}/${jobs.length} jobs`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to index job ${job.id}:`, (error as Error).message);
    }
  }

  console.log(`✅ Indexed ${indexed} jobs`);
  return indexed;
}

async function indexFreelanceJobs() {
  console.log('\n📝 Indexing freelance jobs...');

  const gigs = await prisma.freelanceJob.findMany({
    where: {
      status: { in: ['OPEN', 'FUNDED', 'IN_PROGRESS'] },
    },
    include: {
      category: true,
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  console.log(`Found ${gigs.length} freelance jobs to index`);

  let indexed = 0;
  for (const gig of gigs) {
    try {
      const bidCount = await prisma.bid.count({
        where: { freelanceJobId: gig.id },
      });

      const document = {
        id: gig.id,
        title: gig.title,
        description: gig.description,
        category: gig.category?.label,
        categorySlug: gig.category?.slug,
        budgetMin: gig.budgetMin,
        budgetMax: gig.budgetMax,
        currency: gig.currency,
        pricingType: gig.pricingType,
        deadlineDays: gig.deadlineDays,
        skills: gig.skills,
        status: gig.status,
        featured: gig.featured,
        experienceLevel: gig.experienceLevel,
        locationPreference: gig.locationPreference,
        bidCount,
        clientName: gig.client ? `${gig.client.firstName} ${gig.client.lastName}` : null,
        createdAt: gig.createdAt,
        updatedAt: gig.updatedAt,
        boost: gig.featured ? 2 : 1,
      };

      await opensearch.index({
        index: `${INDEX_PREFIX}_freelance_jobs`,
        id: gig.id,
        body: document,
        refresh: true,
      });

      indexed++;
      if (indexed % 10 === 0) {
        console.log(`  Indexed ${indexed}/${gigs.length} freelance jobs`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to index freelance job ${gig.id}:`, (error as Error).message);
    }
  }

  console.log(`✅ Indexed ${indexed} freelance jobs`);
  return indexed;
}

async function createIndices() {
  console.log('📊 Creating indices...');

  const indices = [
    { name: `${INDEX_PREFIX}_jobs`, type: 'job' },
    { name: `${INDEX_PREFIX}_freelance_jobs`, type: 'freelance' },
  ];

  for (const index of indices) {
    try {
      // Check if index exists
      const exists = await opensearch.indices.exists({ index: index.name });

      if (exists.body) {
        console.log(`  Index ${index.name} already exists, deleting...`);
        await opensearch.indices.delete({ index: index.name });
      }

      // Create index with mappings
      const mappings =
        index.type === 'job'
          ? {
              properties: {
                id: { type: 'keyword' },
                title: {
                  type: 'text',
                  fields: { keyword: { type: 'keyword' }, suggest: { type: 'completion' } },
                },
                description: { type: 'text' },
                requirements: { type: 'text' },
                location: { type: 'text' },
                type: { type: 'keyword' },
                category: { type: 'text' },
                categorySlug: { type: 'keyword' },
                company: { type: 'text' },
                companyId: { type: 'keyword' },
                salaryMin: { type: 'integer' },
                salaryMax: { type: 'integer' },
                currency: { type: 'keyword' },
                experienceLevel: { type: 'keyword' },
                status: { type: 'keyword' },
                featured: { type: 'boolean' },
                urgent: { type: 'boolean' },
                tags: { type: 'text' },
                applicationCount: { type: 'integer' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                deadline: { type: 'date' },
                filled: { type: 'boolean' },
                boost: { type: 'float' },
              },
            }
          : {
              properties: {
                id: { type: 'keyword' },
                title: {
                  type: 'text',
                  fields: { keyword: { type: 'keyword' }, suggest: { type: 'completion' } },
                },
                description: { type: 'text' },
                category: { type: 'text' },
                categorySlug: { type: 'keyword' },
                budgetMin: { type: 'integer' },
                budgetMax: { type: 'integer' },
                currency: { type: 'keyword' },
                pricingType: { type: 'keyword' },
                deadlineDays: { type: 'integer' },
                skills: { type: 'text' },
                status: { type: 'keyword' },
                featured: { type: 'boolean' },
                experienceLevel: { type: 'keyword' },
                locationPreference: { type: 'text' },
                bidCount: { type: 'integer' },
                clientName: { type: 'text' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                boost: { type: 'float' },
              },
            };

      await opensearch.indices.create({
        index: index.name,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
          },
          mappings: mappings as any,
        },
      });

      console.log(`  ✅ Created index: ${index.name}`);
    } catch (error) {
      console.error(`  ❌ Failed to create index ${index.name}:`, (error as Error).message);
    }
  }
}

async function getIndexStats() {
  console.log('\n📊 Index Statistics:');

  try {
    const jobsCount = await opensearch.count({
      index: `${INDEX_PREFIX}_jobs`,
    });
    console.log(`  Jobs: ${jobsCount.body.count} documents`);

    const freelanceCount = await opensearch.count({
      index: `${INDEX_PREFIX}_freelance_jobs`,
    });
    console.log(`  Freelance Jobs: ${freelanceCount.body.count} documents`);
  } catch (error) {
    console.error('  ❌ Failed to get stats:', (error as Error).message);
  }
}

async function main() {
  console.log('🚀 Starting data indexing...\n');

  try {
    // Check OpenSearch connection
    console.log('🔍 Checking OpenSearch connection...');
    const health = await opensearch.cluster.health({});
    console.log(`  ✅ Cluster status: ${health.body.status}\n`);

    // Create indices
    await createIndices();

    // Index data
    await indexJobs();
    await indexFreelanceJobs();

    // Show stats
    await getIndexStats();

    console.log('\n🎉 Indexing complete!');
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
