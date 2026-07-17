// backend/src/modules/analytics/analytics.service.ts
import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { subDays, subMonths, subWeeks, format, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── HELPER METHODS ──────────────────────────────────────────────────────────

  private getStartDate(period: 'day' | 'week' | 'month' | 'year'): Date {
    switch (period) {
      case 'day':
        return subDays(new Date(), 1);
      case 'week':
        return subWeeks(new Date(), 1);
      case 'month':
        return subMonths(new Date(), 1);
      case 'year':
        return subMonths(new Date(), 12);
      default:
        return subMonths(new Date(), 1);
    }
  }

  private groupByDate(
    items: any[],
    dateField: string,
    sumField?: string,
  ): { date: string; count: number; sum?: number }[] {
    const groups: Record<string, { count: number; sum?: number }> = {};
    items.forEach((item) => {
      const date = format(new Date(item[dateField]), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = { count: 0, sum: 0 };
      groups[date].count += 1;
      if (sumField && item[sumField]) {
        groups[date].sum = (groups[date].sum || 0) + (item[sumField] || 0);
      }
    });
    return Object.entries(groups)
      .map(([date, data]) => ({ date, count: data.count, ...(sumField ? { sum: data.sum } : {}) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private groupByStatus(items: any[], statusField: string): { status: string; count: number }[] {
    const groups: Record<string, number> = {};
    items.forEach((item) => {
      const status = item[statusField] || 'UNKNOWN';
      groups[status] = (groups[status] || 0) + 1;
    });
    return Object.entries(groups)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }

  private groupByCategory(
    items: any[],
    categoryField: string,
    labelField: string,
  ): { label: string; count: number }[] {
    const groups: Record<string, number> = {};
    items.forEach((item) => {
      const label = item[categoryField]?.[labelField] || 'Uncategorized';
      groups[label] = (groups[label] || 0) + 1;
    });
    return Object.entries(groups)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ── ADMIN ANALYTICS ─────────────────────────────────────────────────────────

  async getAdminOverviewStats() {
    const [
      totalUsers,
      totalJobs,
      totalFreelanceJobs,
      totalApplications,
      totalBids,
      totalContracts,
      totalEscrowFunded,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.job.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.freelanceJob.count({
        where: { status: { in: ['OPEN', 'FUNDED', 'IN_PROGRESS'] } },
      }),
      this.prisma.application.count(),
      this.prisma.bid.count(),
      this.prisma.contract.count({ where: { status: 'ACTIVE' } }),
      this.prisma.escrowTransaction.count({ where: { status: 'FUNDED' } }),
    ]);

    const totalEarnings = await this.prisma.escrowTransaction.aggregate({
      where: { status: 'RELEASED' },
      _sum: { netAmount: true },
    });

    const jobCategories = await this.prisma.job.groupBy({
      by: ['categoryId'],
      _count: true,
    });

    const categories = await this.prisma.jobCategory.findMany({
      select: { id: true, label: true },
    });

    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.label]));

    return {
      totalUsers,
      totalJobs,
      totalFreelanceJobs,
      totalApplications,
      totalBids,
      totalContracts,
      totalEscrowFunded,
      totalEarnings: totalEarnings._sum.netAmount || 0,
      jobCategories: jobCategories.map((j) => ({
        label: categoryMap[j.categoryId] || 'Unknown',
        count: j._count,
      })),
    };
  }

  async getAdminJobAnalytics(period: 'day' | 'week' | 'month' = 'month') {
    const startDate = this.getStartDate(period);
    const jobs = await this.prisma.job.findMany({
      where: { createdAt: { gte: startDate }, status: 'PUBLISHED' },
      select: {
        createdAt: true,
        status: true,
        category: { select: { label: true } },
        applications: { select: { status: true } },
        salaryMin: true,
        salaryMax: true,
      },
    });

    const avgSalary =
      jobs.length > 0
        ? Math.round(
            jobs.reduce((sum, j) => sum + ((j.salaryMin || 0) + (j.salaryMax || 0)) / 2, 0) /
              jobs.length,
          )
        : 0;

    return {
      daily: this.groupByDate(jobs, 'createdAt'),
      categories: this.groupByCategory(jobs, 'category', 'label'),
      status: this.groupByStatus(jobs, 'status'),
      totalJobs: jobs.length,
      avgSalary,
      applicationStatus: this.groupByStatus(
        jobs.flatMap((j) => j.applications || []),
        'status',
      ),
    };
  }

  async getAdminUserAnalytics() {
    const [totalUsers, usersByRole, recentUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: true }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: subDays(new Date(), 30) } },
        select: { createdAt: true, role: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return {
      totalUsers,
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
      dailySignups: this.groupByDate(recentUsers, 'createdAt'),
      recentUsers: recentUsers.length,
    };
  }

  async getAdminFreelanceAnalytics(period: 'day' | 'week' | 'month' = 'month') {
    const startDate = this.getStartDate(period);
    const gigs = await this.prisma.freelanceJob.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        createdAt: true,
        status: true,
        category: { select: { label: true } },
        budgetMin: true,
        budgetMax: true,
        bids: { select: { status: true } },
        contract: { select: { status: true } },
        escrowTx: { select: { status: true } },
      },
    });

    const avgBudget =
      gigs.length > 0
        ? Math.round(gigs.reduce((sum, g) => sum + (g.budgetMax || 0), 0) / gigs.length)
        : 0;

    const escrowStatus = gigs.filter((g) => g.escrowTx).map((g) => g.escrowTx);

    return {
      daily: this.groupByDate(gigs, 'createdAt'),
      categories: this.groupByCategory(gigs, 'category', 'label'),
      status: this.groupByStatus(gigs, 'status'),
      totalGigs: gigs.length,
      avgBudget,
      escrowStatus: this.groupByStatus(escrowStatus || [], 'status'),
      bidStatus: this.groupByStatus(
        gigs.flatMap((g) => g.bids || []),
        'status',
      ),
    };
  }

  async getAdminEscrowAnalytics() {
    const [total, funded, released, disputed] = await Promise.all([
      this.prisma.escrowTransaction.count(),
      this.prisma.escrowTransaction.count({ where: { status: 'FUNDED' } }),
      this.prisma.escrowTransaction.count({ where: { status: 'RELEASED' } }),
      this.prisma.escrowTransaction.count({ where: { status: 'DISPUTED' } }),
    ]);

    const monthlyData = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count,
        SUM("grossAmount") as total
      FROM "escrow_transactions"
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
      LIMIT 12
    `;

    const totalAmount = await this.prisma.escrowTransaction.aggregate({
      _sum: { grossAmount: true, platformFee: true, netAmount: true },
    });

    return {
      total,
      funded,
      released,
      disputed,
      monthly: monthlyData,
      totalAmount: totalAmount._sum.grossAmount || 0,
      totalFees: totalAmount._sum.platformFee || 0,
      totalNetAmount: totalAmount._sum.netAmount || 0,
    };
  }

  // ── EMPLOYER ANALYTICS ──────────────────────────────────────────────────────

  async getEmployerOverviewStats(userId: string) {
    const [jobs, freelanceJobs, applications, bids, contracts] = await Promise.all([
      this.prisma.job.count({ where: { company: { userId } } }),
      this.prisma.freelanceJob.count({ where: { clientId: userId } }),
      this.prisma.application.count({ where: { job: { company: { userId } } } }),
      this.prisma.bid.count({ where: { freelanceJob: { clientId: userId } } }),
      this.prisma.contract.count({ where: { clientId: userId } }),
    ]);

    const applicationsByStatus = await this.prisma.application.groupBy({
      by: ['status'],
      where: { job: { company: { userId } } },
      _count: true,
    });

    const bidsByStatus = await this.prisma.bid.groupBy({
      by: ['status'],
      where: { freelanceJob: { clientId: userId } },
      _count: true,
    });

    return {
      totalJobs: jobs,
      totalFreelanceJobs: freelanceJobs,
      totalApplications: applications,
      totalBids: bids,
      totalContracts: contracts,
      applicationsByStatus: applicationsByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      bidsByStatus: bidsByStatus.map((s) => ({ status: s.status, count: s._count })),
    };
  }

  async getEmployerJobAnalytics(userId: string, period: 'day' | 'week' | 'month' = 'month') {
    const startDate = this.getStartDate(period);
    const jobs = await this.prisma.job.findMany({
      where: { company: { userId }, createdAt: { gte: startDate } },
      select: {
        createdAt: true,
        status: true,
        category: { select: { label: true } },
        applications: { select: { status: true, createdAt: true } },
        salaryMin: true,
        salaryMax: true,
        filled: true,
      },
    });

    const applicationsByStatus = await this.prisma.application.groupBy({
      by: ['status'],
      where: { job: { company: { userId } } },
      _count: true,
    });

    const totalApplications = jobs.reduce((sum, j) => sum + (j.applications?.length || 0), 0);

    return {
      daily: this.groupByDate(jobs, 'createdAt'),
      categories: this.groupByCategory(jobs, 'category', 'label'),
      status: this.groupByStatus(jobs, 'status'),
      totalJobs: jobs.length,
      filledJobs: jobs.filter((j) => j.filled).length,
      totalApplications,
      avgSalary:
        jobs.length > 0
          ? Math.round(
              jobs.reduce((sum, j) => sum + ((j.salaryMin || 0) + (j.salaryMax || 0)) / 2, 0) /
                jobs.length,
            )
          : 0,
      applicationsByStatus: applicationsByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      applicationTrend: this.groupByDate(
        jobs.flatMap((j) => j.applications || []),
        'createdAt',
      ),
    };
  }

  async getEmployerApplicationAnalytics(
    userId: string,
    period: 'day' | 'week' | 'month' = 'month',
  ) {
    const startDate = this.getStartDate(period);
    const applications = await this.prisma.application.findMany({
      where: { job: { company: { userId } }, createdAt: { gte: startDate } },
      select: {
        createdAt: true,
        status: true,
        job: { select: { title: true } },
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const topJobs = await this.prisma.application.groupBy({
      by: ['jobId'],
      where: { job: { company: { userId } } },
      _count: true,
      orderBy: { _count: { jobId: 'desc' } },
      take: 5,
    });

    const jobTitles = await Promise.all(
      topJobs.map(async (item) => {
        const job = await this.prisma.job.findUnique({
          where: { id: item.jobId },
          select: { title: true },
        });
        return { title: job?.title || 'Unknown', count: item._count };
      }),
    );

    const recentApplications = applications.slice(0, 10).map((app) => ({
      candidate: `${app.user?.firstName || ''} ${app.user?.lastName || ''}`.trim() || 'Unknown',
      jobTitle: app.job?.title || 'Unknown',
      status: app.status,
      date: app.createdAt,
    }));

    return {
      daily: this.groupByDate(applications, 'createdAt'),
      status: this.groupByStatus(applications, 'status'),
      topJobs: jobTitles,
      totalApplications: applications.length,
      recentApplications,
    };
  }

  // ── JOB SEEKER / FREELANCER ANALYTICS ─────────────────────────────────────

  async getUserOverviewStats(userId: string) {
    const [applications, bids, contracts, wallet, savedJobs] = await Promise.all([
      this.prisma.application.count({ where: { userId } }),
      this.prisma.bid.count({ where: { freelancerId: userId } }),
      this.prisma.contract.count({ where: { freelancerId: userId, status: 'ACTIVE' } }),
      this.prisma.freelancerWallet.findUnique({ where: { userId } }),
      // If you have saved jobs, add: this.prisma.savedJob.count({ where: { userId } })
      0,
    ]);

    const applicationsByStatus = await this.prisma.application.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    const bidsByStatus = await this.prisma.bid.groupBy({
      by: ['status'],
      where: { freelancerId: userId },
      _count: true,
    });

    return {
      totalApplications: applications,
      totalBids: bids,
      activeContracts: contracts,
      savedJobs,
      availableBalance: wallet?.availableBalance || 0,
      pendingBalance: wallet?.pendingBalance || 0,
      applicationsByStatus: applicationsByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      bidsByStatus: bidsByStatus.map((s) => ({ status: s.status, count: s._count })),
    };
  }

  async getUserApplicationAnalytics(userId: string, period: 'day' | 'week' | 'month' = 'month') {
    const startDate = this.getStartDate(period);
    const applications = await this.prisma.application.findMany({
      where: { userId, createdAt: { gte: startDate } },
      select: { createdAt: true, status: true, job: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const statusCounts = this.groupByStatus(applications, 'status');

    return {
      daily: this.groupByDate(applications, 'createdAt'),
      status: statusCounts,
      totalApplications: applications.length,
      recentApplications: applications.slice(0, 10).map((app) => ({
        title: app.job?.title || 'Unknown',
        status: app.status,
        date: app.createdAt,
      })),
      acceptanceRate: statusCounts.find((s) => s.status === 'OFFERED')?.count || 0,
    };
  }

  async getUserBidAnalytics(userId: string, period: 'day' | 'week' | 'month' = 'month') {
    const startDate = this.getStartDate(period);
    const bids = await this.prisma.bid.findMany({
      where: { freelancerId: userId, createdAt: { gte: startDate } },
      select: { createdAt: true, status: true, amount: true },
    });

    const totalBidAmount = bids.reduce((sum, b) => sum + b.amount, 0);
    const statusCounts = this.groupByStatus(bids, 'status');

    return {
      daily: this.groupByDate(bids, 'createdAt'),
      status: statusCounts,
      totalBids: bids.length,
      totalBidAmount,
      averageBid: bids.length > 0 ? Math.round(totalBidAmount / bids.length) : 0,
      acceptanceRate: statusCounts.find((s) => s.status === 'ACCEPTED')?.count || 0,
    };
  }

  async getUserEarningsAnalytics(userId: string) {
    const [contracts, wallet, transactions] = await Promise.all([
      this.prisma.contract.findMany({
        where: { freelancerId: userId, status: 'COMPLETED' },
        select: {
          agreedAmount: true,
          completedAt: true,
          freelanceJob: { select: { title: true } },
        },
      }),
      this.prisma.freelancerWallet.findUnique({ where: { userId } }),
      this.prisma.walletTransaction.findMany({
        where: { wallet: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const totalEarned = contracts.reduce((sum, c) => sum + c.agreedAmount, 0);
    const monthlyEarnings = this.groupByDate(contracts, 'completedAt', 'agreedAmount');

    return {
      totalEarned,
      totalContracts: contracts.length,
      availableBalance: wallet?.availableBalance || 0,
      pendingBalance: wallet?.pendingBalance || 0,
      monthlyEarnings,
      recentTransactions: transactions.map((t) => ({
        type: t.type,
        amount: t.amount,
        note: t.note,
        createdAt: t.createdAt,
      })),
      topContracts: contracts.slice(0, 5).map((c) => ({
        title: c.freelanceJob?.title || 'Unknown',
        amount: c.agreedAmount,
        date: c.completedAt,
      })),
    };
  }

  // ── FREELANCER SPECIFIC ────────────────────────────────────────────────────

  async getFreelancerContractAnalytics(userId: string) {
    const [active, completed, disputed, cancelled] = await Promise.all([
      this.prisma.contract.count({ where: { freelancerId: userId, status: 'ACTIVE' } }),
      this.prisma.contract.count({ where: { freelancerId: userId, status: 'COMPLETED' } }),
      this.prisma.contract.count({ where: { freelancerId: userId, status: 'DISPUTED' } }),
      this.prisma.contract.count({ where: { freelancerId: userId, status: 'CANCELLED' } }),
    ]);

    const milestones = await this.prisma.milestone.findMany({
      where: { contract: { freelancerId: userId } },
      select: { status: true, amount: true, approvedAt: true, createdAt: true },
    });

    const milestoneStatus = this.groupByStatus(milestones, 'status');
    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);

    const recentContracts = await this.prisma.contract.findMany({
      where: { freelancerId: userId },
      select: {
        id: true,
        freelanceJob: { select: { title: true } },
        agreedAmount: true,
        status: true,
        startedAt: true,
      },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    return {
      activeContracts: active,
      completedContracts: completed,
      disputedContracts: disputed,
      cancelledContracts: cancelled,
      milestoneStatus,
      totalMilestoneAmount,
      totalMilestones: milestones.length,
      recentContracts,
      completionRate:
        active + completed > 0 ? Math.round((completed / (active + completed)) * 100) : 0,
    };
  }

  async getFreelancerPortfolioAnalytics(userId: string) {
    const [projects, workHistory, certifications, testimonials] = await Promise.all([
      this.prisma.project.count({ where: { userId } }),
      this.prisma.workHistory.count({ where: { userId } }),
      this.prisma.certification.count({ where: { userId } }),
      this.prisma.testimonial.count({ where: { userId, isPublic: true } }),
    ]);

    const recentProjects = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { title: true, category: true, createdAt: true, featured: true },
    });

    const skills = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { skills: true },
    });

    const testimonialRatings = await this.prisma.testimonial.aggregate({
      where: { userId, isPublic: true, rating: { not: null } },
      _avg: { rating: true },
      _count: true,
    });

    return {
      totalProjects: projects,
      totalWorkHistory: workHistory,
      totalCertifications: certifications,
      totalTestimonials: testimonials,
      recentProjects,
      skills: skills?.skills || [],
      averageRating: testimonialRatings._avg.rating || 0,
      totalReviews: testimonialRatings._count || 0,
    };
  }

  // ── DASHBOARD OVERVIEW (Simplified for each role) ────────────────────────

  async getDashboardOverview(userId: string, role: string) {
    switch (role) {
      case 'ADMIN':
        return this.getAdminOverviewStats();
      case 'EMPLOYER':
        return this.getEmployerOverviewStats(userId);
      case 'FREELANCER':
      case 'JOB_SEEKER':
        return this.getUserOverviewStats(userId);
      default:
        throw new ForbiddenException('Invalid role');
    }
  }
}
