import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto, CreateCompanyDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        phone: true,
        telegramId: true,
        createdAt: true,
        company: true,
        headline: true,
        bio: true,
        location: true,
        defaultResumeUrl: true,
        portfolioUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        skills: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        location: true,
        bio: true,
        headline: true,
        skills: true,
        role: true,
        avatarUrl: true,
        portfolioUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        defaultResumeUrl: true,
        telegramId: true,
        createdAt: true,
        company: {
          select: {
            name: true,
            verified: true,
            description: true,
            industry: true,
            size: true,
            location: true,
            website: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get freelancer stats (if the user is a freelancer)
    let stats = undefined;
    if (user.role === 'FREELANCER' || user.role === 'JOB_SEEKER') {
      // Get completed contracts count
      const completedContracts = await this.prisma.contract.count({
        where: {
          freelancerId: id,
          status: 'COMPLETED',
        },
      });

      // Get total earned from completed contracts
      const earnedContracts = await this.prisma.contract.findMany({
        where: {
          freelancerId: id,
          status: 'COMPLETED',
        },
        select: {
          agreedAmount: true,
        },
      });

      const totalEarned = earnedContracts.reduce((sum, contract) => sum + contract.agreedAmount, 0);

      // Get total jobs (contracts)
      const totalJobs = await this.prisma.contract.count({
        where: {
          freelancerId: id,
        },
      });

      // Calculate rating (you can implement this later)
      const rating = 0; // Placeholder

      stats = {
        totalJobs,
        totalEarned,
        rating,
        completedProjects: completedContracts,
      };
    }

    return {
      ...user,
      stats,
    };
  }
  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        phone: true,
        telegramId: true,
        createdAt: true,
        company: true,
        headline: true,
        bio: true,
        location: true,
        defaultResumeUrl: true,
        portfolioUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        skills: true,
      },
    });
  }

  async createCompany(userId: string, dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: { ...dto, userId } });
  }

  async getCompany(userId: string) {
    return this.prisma.company.findUnique({
      where: { userId },
      include: { jobs: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }
}
