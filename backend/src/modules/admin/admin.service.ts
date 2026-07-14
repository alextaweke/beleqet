// admin/admin.service.ts
import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ResolveDisputeDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // User Management
  // ============================================

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        avatarUrl: true,
        phone: true,
        _count: {
          select: {
            applications: true,
            bids: true,
            freelanceJobs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserStats() {
    const [total, active, suspended, byRole] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      suspended,
      byRole: byRole.map((item) => ({
        role: item.role,
        count: item._count,
      })),
    };
  }

  async suspendUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot suspend an admin user');
    }

    if (!user.isActive) {
      throw new BadRequestException('User is already suspended');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    this.logger.log(`User ${user.email} (${user.id}) suspended by admin`);
    return updated;
  }

  async reactivateUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    this.logger.log(`User ${user.email} (${user.id}) reactivated by admin`);
    return updated;
  }

  async toggleUserStatus(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot modify admin user status');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    const action = updated.isActive ? 'reactivated' : 'suspended';
    this.logger.log(`User ${user.email} (${user.id}) ${action} by admin`);
    return updated;
  }

  // ============================================
  // Dispute Management
  // ============================================

  async getDisputes() {
    return this.prisma.dispute.findMany({
      include: {
        contract: {
          include: {
            freelanceJob: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            freelancer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getDisputeStats() {
    const [total, resolved, pending] = await Promise.all([
      this.prisma.dispute.count(),
      this.prisma.dispute.count({ where: { resolution: { not: null } } }),
      this.prisma.dispute.count({ where: { resolution: null } }),
    ]);

    return {
      total,
      resolved,
      pending,
    };
  }

  async getDispute(id: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            freelanceJob: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            freelancer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${id} not found`);
    }

    return dispute;
  }

  async resolveDispute(id: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            freelanceJob: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${id} not found`);
    }

    if (dispute.resolution) {
      throw new BadRequestException('This dispute has already been resolved');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedDispute = await tx.dispute.update({
        where: { id },
        data: {
          resolution: dto.resolution,
          resolvedAt: new Date(),
        },
      });

      await tx.contract.update({
        where: { id: dispute.contractId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await tx.eventLog.create({
        data: {
          eventType: 'dispute.resolved',
          entityId: id,
          entityType: 'Dispute',
          payload: {
            disputeId: id,
            contractId: dispute.contractId,
            resolution: dto.resolution,
            resolvedBy: 'ADMIN',
          },
          processedBy: AdminService.name,
        },
      });

      return updatedDispute;
    });

    this.logger.log(`Dispute ${id} resolved by admin: ${dto.resolution}`);
    return updated;
  }

  // ============================================
  // Platform Statistics
  // ============================================

  async getPlatformStats() {
    const [
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalApplications,
      totalFreelanceJobs,
      openFreelanceJobs,
      totalCompanies,
      totalDisputes,
      pendingDisputes,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.job.count(),
      this.prisma.job.count({
        where: {
          status: 'PUBLISHED',
          filled: false,
          OR: [{ deadline: { gt: new Date() } }, { deadline: null }],
        },
      }),
      this.prisma.application.count(),
      this.prisma.freelanceJob.count(),
      this.prisma.freelanceJob.count({
        where: {
          status: { in: ['OPEN', 'FUNDED'] },
        },
      }),
      this.prisma.company.count(),
      this.prisma.dispute.count(),
      this.prisma.dispute.count({ where: { resolution: null } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
      },
      applications: {
        total: totalApplications,
      },
      freelance: {
        total: totalFreelanceJobs,
        open: openFreelanceJobs,
      },
      companies: {
        total: totalCompanies,
      },
      disputes: {
        total: totalDisputes,
        pending: pendingDisputes,
      },
      timestamp: new Date(),
    };
  }

  async getJobStats() {
    const [byStatus, byType, featured, urgent, filled] = await Promise.all([
      this.prisma.job.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.job.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.prisma.job.count({ where: { featured: true } }),
      this.prisma.job.count({ where: { urgent: true } }),
      this.prisma.job.count({ where: { filled: true } }),
    ]);

    return {
      byStatus,
      byType,
      featured,
      urgent,
      filled,
    };
  }
}
