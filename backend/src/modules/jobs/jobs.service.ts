import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto, QueryJobsDto } from './dto/create-job.dto';
import { CreateJobCategoryDto } from './dto/create-category.dto';
import { Prisma } from '@prisma/client';
import { JobStatus } from '@prisma/client';
@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(employerId: string, dto: CreateJobDto) {
    const company = await this.prisma.company.findUnique({
      where: { userId: employerId },
    });

    if (!company) {
      throw new ForbiddenException('Create a company profile before posting jobs');
    }

    const data: any = {
      ...dto,
      companyId: company.id,
      status: dto.status || 'PUBLISHED',
    };

    // Properly handle date fields
    if (data.deadline) {
      data.deadline = new Date(data.deadline);
    }
    if (data.expiryDate) {
      data.expiryDate = new Date(data.expiryDate);
    }

    // Ensure numeric fields are properly typed
    if (data.salaryMin) data.salaryMin = Number(data.salaryMin);
    if (data.salaryMax) data.salaryMax = Number(data.salaryMax);
    if (data.vacancies) data.vacancies = Number(data.vacancies);

    return this.prisma.job.create({
      data,
      include: {
        company: true,
        category: true,
      },
    });
  }
  async createCategory(dto: CreateJobCategoryDto) {
    return this.prisma.jobCategory.create({
      data: dto as Prisma.JobCategoryCreateInput, // Explicit type cast
    });
  }

  async getCategories() {
    return this.prisma.jobCategory.findMany({
      orderBy: { label: 'asc' },
    });
  }

  async findAll(query: QueryJobsDto) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 20;
    const { q, category, location, type } = query;

    const where: Record<string, unknown> = { status: 'PUBLISHED' };

    if (type) {
      where['type'] = type;
    }

    if (category) {
      where['category'] = { slug: category };
    }

    if (location) {
      where['location'] = {
        contains: location,
        mode: 'insensitive',
      };
    }

    if (q) {
      where['OR'] = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where: where as any,
        include: {
          company: true,
          category: true,
          _count: { select: { applications: true } },
        },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prisma.job.count({ where: where as any }),
    ]);

    // Ensure only active jobs are shown to job seekers
    const activeItems = items.filter(
      (job) =>
        job.status === 'PUBLISHED' &&
        (!job.deadline || new Date(job.deadline) > new Date()) &&
        job.filled !== true,
    );

    return {
      items: activeItems,
      total: activeItems.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(activeItems.length / limitNum),
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        category: true,
        _count: { select: { applications: true } },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    // Allow viewing if job is published and not filled
    if (job.status !== 'PUBLISHED' || job.filled === true) {
      throw new NotFoundException(`Job ${id} is not available`);
    }

    return job;
  }

  async update(id: string, employerId: string, dto: Partial<CreateJobDto>) {
    const job = await this.prisma.job.findFirst({
      where: {
        id,
        company: { userId: employerId },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or access denied');
    }

    const data: any = { ...dto };

    // Properly handle date fields
    if (data.deadline) {
      data.deadline = new Date(data.deadline);
    }
    if (data.expiryDate) {
      data.expiryDate = new Date(data.expiryDate);
    }

    return this.prisma.job.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, employerId: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id,
        company: { userId: employerId },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or access denied');
    }

    return this.prisma.job.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async findByCompany(employerId: string) {
    const baseWhere = { company: { userId: employerId } };

    const [jobs, totalCount, activeCount] = await this.prisma.$transaction([
      // 1. Fetch all job records for this employer
      this.prisma.job.findMany({
        where: baseWhere,
        include: {
          category: true,
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // 2. Count total jobs ever created (Drafts, Published, etc.)
      this.prisma.job.count({ where: baseWhere }),
      // 3. Count only currently active/published jobs
      this.prisma.job.count({
        where: {
          ...baseWhere,
          status: JobStatus.PUBLISHED, // Change to JobStatus.ACTIVE if your enum uses that string
        },
      }),
    ]);

    // Define a default maximum allowed job limit for employers (e.g., 10)
    // You can also change this to Infinity if there is no restriction
    const allowedLimit = 10;

    return {
      jobs,
      totalCount,
      activeCount,
      allowedLimit,
      canPostMore: activeCount < allowedLimit, // Helper flag for your frontend
    };
  }
}
