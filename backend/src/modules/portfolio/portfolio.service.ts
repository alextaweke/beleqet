import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProjectDto,
  CreateWorkHistoryDto,
  CreateTestimonialDto,
  CreateCertificationDto,
} from './dto/create-portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  // ── PROJECTS ──────────────────────────────────────────────────────────
  async createProject(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        title: dto.title,
        description: dto.description,
        userId,
        category: dto.category,
        imageUrl: dto.imageUrl,
        demoUrl: dto.demoUrl,
        githubUrl: dto.githubUrl,
        videoUrl: dto.videoUrl,
        technologies: dto.technologies || [],
        featured: dto.featured || false,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      },
    });
  }

  async getProjects(userId?: string) {
    const where = userId ? { userId } : {};
    return this.prisma.project.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getProjectById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            headline: true,
            location: true,
          },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(id: string, userId: string, dto: Partial<CreateProjectDto>) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId)
      throw new ForbiddenException('You can only update your own projects');

    return this.prisma.project.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        imageUrl: dto.imageUrl,
        demoUrl: dto.demoUrl,
        githubUrl: dto.githubUrl,
        videoUrl: dto.videoUrl,
        technologies: dto.technologies,
        featured: dto.featured,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      },
    });
  }

  async deleteProject(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId)
      throw new ForbiddenException('You can only delete your own projects');
    return this.prisma.project.delete({ where: { id } });
  }

  // ── WORK HISTORY ──────────────────────────────────────────────────────
  async createWorkHistory(userId: string, dto: CreateWorkHistoryDto) {
    return this.prisma.workHistory.create({
      data: {
        userId,
        title: dto.title,
        company: dto.company,
        companyUrl: dto.companyUrl,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        current: dto.current || false,
        description: dto.description,
        achievements: dto.achievements || [],
      },
    });
  }

  async getWorkHistory(userId: string) {
    return this.prisma.workHistory.findMany({
      where: { userId },
      orderBy: [{ current: 'desc' }, { startDate: 'desc' }],
    });
  }

  async updateWorkHistory(id: string, userId: string, dto: Partial<CreateWorkHistoryDto>) {
    const work = await this.prisma.workHistory.findUnique({ where: { id } });
    if (!work) throw new NotFoundException('Work history not found');
    if (work.userId !== userId)
      throw new ForbiddenException('You can only update your own work history');

    return this.prisma.workHistory.update({
      where: { id },
      data: {
        title: dto.title,
        company: dto.company,
        companyUrl: dto.companyUrl,
        location: dto.location,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        current: dto.current,
        description: dto.description,
        achievements: dto.achievements,
      },
    });
  }

  async deleteWorkHistory(id: string, userId: string) {
    const work = await this.prisma.workHistory.findUnique({ where: { id } });
    if (!work) throw new NotFoundException('Work history not found');
    if (work.userId !== userId)
      throw new ForbiddenException('You can only delete your own work history');
    return this.prisma.workHistory.delete({ where: { id } });
  }

  // ── TESTIMONIALS ──────────────────────────────────────────────────────
  async createTestimonial(authorId: string, dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({
      data: {
        userId: dto.userId,
        authorId,
        authorName: dto.authorName,
        authorRole: dto.authorRole,
        authorCompany: dto.authorCompany,
        authorAvatarUrl: dto.authorAvatarUrl,
        content: dto.content,
        rating: dto.rating,
        projectId: dto.projectId,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
      },
    });
  }

  async getTestimonials(userId: string, isPublicOnly: boolean = true) {
    const where: any = { userId };
    if (isPublicOnly) where.isPublic = true;

    return this.prisma.testimonial.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteTestimonial(id: string, userId: string) {
    const testimonial = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) throw new NotFoundException('Testimonial not found');
    if (testimonial.authorId !== userId)
      throw new ForbiddenException('You can only delete your own testimonials');
    return this.prisma.testimonial.delete({ where: { id } });
  }

  // ── CERTIFICATIONS ────────────────────────────────────────────────────
  async createCertification(userId: string, dto: CreateCertificationDto) {
    return this.prisma.certification.create({
      data: {
        userId,
        name: dto.name,
        issuingOrg: dto.issuingOrg,
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        credentialId: dto.credentialId,
        credentialUrl: dto.credentialUrl,
        iconUrl: dto.iconUrl,
      },
    });
  }

  async getCertifications(userId: string) {
    return this.prisma.certification.findMany({
      where: { userId },
      orderBy: [{ issueDate: 'desc' }],
    });
  }

  async updateCertification(id: string, userId: string, dto: Partial<CreateCertificationDto>) {
    const cert = await this.prisma.certification.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certification not found');
    if (cert.userId !== userId)
      throw new ForbiddenException('You can only update your own certifications');

    return this.prisma.certification.update({
      where: { id },
      data: {
        name: dto.name,
        issuingOrg: dto.issuingOrg,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        credentialId: dto.credentialId,
        credentialUrl: dto.credentialUrl,
        iconUrl: dto.iconUrl,
      },
    });
  }

  async deleteCertification(id: string, userId: string) {
    const cert = await this.prisma.certification.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certification not found');
    if (cert.userId !== userId)
      throw new ForbiddenException('You can only delete your own certifications');
    return this.prisma.certification.delete({ where: { id } });
  }

  // ── COMPLETE PORTFOLIO ──────────────────────────────────────────────
  async getFullPortfolio(userId: string) {
    const [projects, workHistory, certifications, testimonials] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.workHistory.findMany({
        where: { userId },
        orderBy: [{ current: 'desc' }, { startDate: 'desc' }],
      }),
      this.prisma.certification.findMany({
        where: { userId },
        orderBy: [{ issueDate: 'desc' }],
      }),
      this.prisma.testimonial.findMany({
        where: { userId, isPublic: true },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      projects,
      workHistory,
      certifications,
      testimonials,
      totalProjects: projects.length,
      totalWorkHistory: workHistory.length,
      totalCertifications: certifications.length,
      totalTestimonials: testimonials.length,
    };
  }
}
