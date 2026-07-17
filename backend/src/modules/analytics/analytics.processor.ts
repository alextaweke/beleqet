// backend/src/modules/analytics/analytics.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES, ANALYTICS_JOBS } from '../queues/queues.constants';

@Injectable()
@Processor(QUEUE_NAMES.ANALYTICS)
export class AnalyticsProcessor {
  private readonly logger = new Logger(AnalyticsProcessor.name);
  constructor(private readonly prisma: PrismaService) {}

  @Process(ANALYTICS_JOBS.LOG_EVENT)
  async logEvent(job: Job<{ eventType: string; [key: string]: unknown }>) {
    await this.prisma.eventLog.create({
      data: {
        eventType: job.data.eventType,
        entityId: String(job.data.jobId ?? job.data.applicationId ?? 'global'),
        entityType: 'Analytics',
        payload: job.data as never,
        processedBy: AnalyticsProcessor.name,
      },
    });
  }

  @Process(ANALYTICS_JOBS.UPDATE_JOB_STATS)
  async updateJobStats(job: Job<{ jobId: string }>) {
    const count = await this.prisma.application.count({ where: { jobId: job.data.jobId } });
    this.logger.debug(`Job ${job.data.jobId} now has ${count} applications`);
  }

  @Process(ANALYTICS_JOBS.UPDATE_USER_STATS)
  async updateUserStats(job: Job<{ userId: string }>) {
    const applications = await this.prisma.application.count({
      where: { userId: job.data.userId },
    });
    this.logger.debug(`User ${job.data.userId} has ${applications} applications`);
  }

  @Process(ANALYTICS_JOBS.GENERATE_DAILY_REPORT)
  async generateDailyReport() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const [newUsers, newJobs, newApplications] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.job.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.application.count({ where: { createdAt: { gte: startOfDay } } }),
    ]);

    this.logger.log(
      `Daily Report - Users: ${newUsers}, Jobs: ${newJobs}, Applications: ${newApplications}`,
    );
  }

  @Process(ANALYTICS_JOBS.UPDATE_FREELANCE_STATS)
  async updateFreelanceStats(job: Job<{ freelanceJobId: string }>) {
    const bids = await this.prisma.bid.count({
      where: { freelanceJobId: job.data.freelanceJobId },
    });
    this.logger.debug(`Freelance job ${job.data.freelanceJobId} has ${bids} bids`);
  }

  @Process(ANALYTICS_JOBS.UPDATE_APPLICATION_STATS)
  async updateApplicationStats(job: Job<{ applicationId: string }>) {
    const application = await this.prisma.application.findUnique({
      where: { id: job.data.applicationId },
      select: { jobId: true, status: true },
    });
    if (application) {
      this.logger.debug(
        `Application ${job.data.applicationId} status updated to ${application.status}`,
      );
    }
  }

  @Process(ANALYTICS_JOBS.UPDATE_CONTRACT_STATS)
  async updateContractStats(job: Job<{ contractId: string }>) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: job.data.contractId },
      select: { status: true },
    });
    if (contract) {
      this.logger.debug(`Contract ${job.data.contractId} status updated to ${contract.status}`);
    }
  }

  @Process(ANALYTICS_JOBS.UPDATE_ESCROW_STATS)
  async updateEscrowStats(job: Job<{ escrowId: string }>) {
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { id: job.data.escrowId },
      select: { status: true, grossAmount: true },
    });
    if (escrow) {
      this.logger.debug(`Escrow ${job.data.escrowId} status updated to ${escrow.status}`);
    }
  }
}
