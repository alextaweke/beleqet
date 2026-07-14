// freelance/freelance.service.ts (updated with all methods)
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateFreelanceJobDto,
  CreateBidDto,
  QueryFreelanceJobsDto,
  FreelanceJobStatus,
  ExperienceLevel,
  PricingType,
  CreateMilestoneDto,
  CreateDeliverableDto,
  CreateDisputeDto,
  FundEscrowDto,
  ReleaseEscrowDto,
  EscrowStatus,
  BidStatus,
} from './dto';
import { CreateFrelanceCategoryDto } from './dto/create-category.dto';

@Injectable()
export class FreelanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // Job Management
  // ============================================

  async createJob(clientId: string, dto: CreateFreelanceJobDto) {
    // Validate budget
    if (dto.budgetMin > dto.budgetMax) {
      throw new ConflictException('Minimum budget cannot be greater than maximum budget');
    }

    // Check if client exists and is an employer
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { role: true },
    });

    if (!client || client.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only employers can create freelance jobs');
    }

    return this.prisma.freelanceJob.create({
      data: {
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        pricingType: dto.pricingType || PricingType.FIXED,
        deadlineDays: dto.deadlineDays,
        skills: dto.skills,
        locationPreference: dto.locationPreference || null,
        experienceLevel: dto.experienceLevel || null,
        attachments: dto.attachments || [],
        clientId,
        status: FreelanceJobStatus.OPEN,
      },
      include: {
        category: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findJobs(query: QueryFreelanceJobsDto) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 20;
    const { q, category } = query;

    const where: Record<string, unknown> = {
      status: {
        in: [FreelanceJobStatus.OPEN, FreelanceJobStatus.FUNDED],
      },
    };

    if (category) {
      where['category'] = { slug: category };
    }

    if (q) {
      where['OR'] = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.freelanceJob.findMany({
        where: where as any,
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
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prisma.freelanceJob.count({ where: where as any }),
    ]);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findJobById(id: string) {
    const job = await this.prisma.freelanceJob.findUnique({
      where: { id },
      include: {
        category: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        bids: {
          include: {
            freelancer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: { bids: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Gig not found');
    }

    return job;
  }

  async updateJob(jobId: string, clientId: string, dto: Partial<CreateFreelanceJobDto>) {
    const job = await this.prisma.freelanceJob.findFirst({
      where: {
        id: jobId,
        clientId,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or you do not have permission');
    }

    if (job.status !== FreelanceJobStatus.OPEN) {
      throw new ConflictException('Cannot update a job that is not open');
    }

    return this.prisma.freelanceJob.update({
      where: { id: jobId },
      data: {
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        pricingType: dto.pricingType,
        deadlineDays: dto.deadlineDays,
        skills: dto.skills,
        locationPreference: dto.locationPreference,
        experienceLevel: dto.experienceLevel,
        attachments: dto.attachments,
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
  }

  async deleteJob(jobId: string, clientId: string) {
    const job = await this.prisma.freelanceJob.findFirst({
      where: {
        id: jobId,
        clientId,
      },
      include: {
        bids: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or you do not have permission');
    }

    if (job.status !== FreelanceJobStatus.OPEN) {
      throw new ConflictException('Cannot delete a job that is not open');
    }

    if (job.bids.length > 0) {
      throw new ConflictException('Cannot delete a job that has bids');
    }

    return this.prisma.freelanceJob.delete({
      where: { id: jobId },
    });
  }

  // ============================================
  // Bid Management
  // ============================================

  async submitBid(freelancerId: string, gigId: string, dto: CreateBidDto) {
    // Check if gig exists and is accepting bids
    const gig = await this.prisma.freelanceJob.findFirst({
      where: {
        id: gigId,
        status: {
          in: [FreelanceJobStatus.OPEN, FreelanceJobStatus.FUNDED],
        },
      },
    });

    if (!gig) {
      throw new NotFoundException('Gig not found or no longer accepting bids');
    }

    // Check if freelancer has already bid
    const existing = await this.prisma.bid.findUnique({
      where: {
        freelanceJobId_freelancerId: {
          freelanceJobId: gigId,
          freelancerId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('You have already submitted a bid for this gig');
    }

    // Check if freelancer is trying to bid on their own gig
    if (gig.clientId === freelancerId) {
      throw new ForbiddenException('You cannot bid on your own gig');
    }

    return this.prisma.bid.create({
      data: {
        amount: dto.amount,
        timelineDays: dto.timelineDays,
        coverLetter: dto.coverLetter,
        freelanceJobId: gigId,
        freelancerId,
        status: BidStatus.PENDING,
      },
      include: {
        freelancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        freelanceJob: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  // freelance/freelance.service.ts - Update acceptBid method

  // freelance/freelance.service.ts - Update acceptBid method

  // freelance/freelance.service.ts - Update acceptBid method

  async acceptBid(bidId: string, clientId: string) {
    const bid = await this.prisma.bid.findFirst({
      where: {
        id: bidId,
        freelanceJob: {
          clientId,
        },
      },
      include: {
        freelanceJob: true,
      },
    });

    if (!bid) {
      throw new NotFoundException('Bid not found or you do not have permission');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new ConflictException('This bid has already been processed');
    }

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Accept chosen bid
      await tx.bid.update({
        where: { id: bidId },
        data: { status: BidStatus.ACCEPTED },
      });

      // Reject all other bids
      await tx.bid.updateMany({
        where: {
          freelanceJobId: bid.freelanceJobId,
          id: { not: bidId },
        },
        data: { status: BidStatus.REJECTED },
      });

      // Create contract
      const newContract = await tx.contract.create({
        data: {
          freelanceJobId: bid.freelanceJobId,
          clientId,
          freelancerId: bid.freelancerId,
          agreedAmount: bid.amount,
          status: 'ACTIVE',
        },
      });

      // Update gig status
      await tx.freelanceJob.update({
        where: { id: bid.freelanceJobId },
        data: { status: FreelanceJobStatus.IN_PROGRESS },
      });

      // Create chat room for this contract
      const chatRoom = await tx.chatRoom.create({
        data: {
          contractId: newContract.id,
          participants: {
            create: [{ userId: clientId }, { userId: bid.freelancerId }],
          },
        },
      });

      return {
        ...newContract,
        chatRoomId: chatRoom.id,
      };
    });

    return result;
  }
  async getMyBids(freelancerId: string) {
    return this.prisma.bid.findMany({
      where: { freelancerId },
      include: {
        freelanceJob: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async withdrawBid(bidId: string, freelancerId: string) {
    const bid = await this.prisma.bid.findFirst({
      where: {
        id: bidId,
        freelancerId,
        status: BidStatus.PENDING,
      },
    });

    if (!bid) {
      throw new NotFoundException('Bid not found or cannot be withdrawn');
    }

    return this.prisma.bid.update({
      where: { id: bidId },
      data: { status: BidStatus.WITHDRAWN },
    });
  }

  // ============================================
  // Contract Management
  // ============================================
  // freelance/freelance.service.ts - Update getContract method

  async getContract(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        freelanceJob: {
          include: {
            category: true,
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
        milestones: {
          include: {
            deliverables: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        dispute: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Get chat room
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: { contractId: contract.id },
    });

    return {
      ...contract,
      chatRoomId: chatRoom?.id || null,
    };
  }
  async getMyContracts(userId: string, role: 'client' | 'freelancer') {
    const where = role === 'client' ? { clientId: userId } : { freelancerId: userId };

    return this.prisma.contract.findMany({
      where,
      include: {
        freelanceJob: {
          include: {
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        milestones: {
          include: {
            deliverables: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }
  // freelance/freelance.service.ts - Add this method

  async getContractWithChatRoom(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        freelanceJob: {
          include: {
            category: true,
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
        milestones: {
          include: {
            deliverables: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        dispute: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Get or create chat room
    let chatRoom = await this.prisma.chatRoom.findUnique({
      where: { contractId: contract.id },
    });

    if (!chatRoom) {
      // Create chat room if it doesn't exist
      chatRoom = await this.prisma.chatRoom.create({
        data: {
          contractId: contract.id,
          participants: {
            create: [{ userId: contract.clientId }, { userId: contract.freelancerId }],
          },
        },
      });
    }

    return {
      ...contract,
      chatRoomId: chatRoom.id,
    };
  }
  // ============================================
  // Milestone Management
  // ============================================

  async createMilestone(clientId: string, dto: CreateMilestoneDto) {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: dto.contractId,
        clientId,
        status: 'ACTIVE',
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found or you do not have permission');
    }

    return this.prisma.milestone.create({
      data: {
        contractId: dto.contractId,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        deadline: new Date(dto.deadline),
        status: 'PENDING',
      },
    });
  }

  async approveMilestone(milestoneId: string, clientId: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        contract: {
          clientId,
        },
      },
    });

    if (!milestone) {
      throw new ForbiddenException('Not authorized or milestone not found');
    }

    if (milestone.status === 'APPROVED') {
      throw new ConflictException('This milestone has already been approved');
    }

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });
  }

  async submitDeliverable(freelancerId: string, dto: CreateDeliverableDto) {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: dto.milestoneId,
        contract: {
          freelancerId,
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found or you do not have permission');
    }

    if (milestone.status === 'APPROVED') {
      throw new ConflictException('This milestone has already been approved');
    }

    return this.prisma.deliverable.create({
      data: {
        milestoneId: dto.milestoneId,
        fileUrl: dto.fileUrl,
        notes: dto.notes,
        submittedAt: new Date(),
      },
    });
  }

  // ============================================
  // Dispute Management
  // ============================================

  async createDispute(userId: string, dto: CreateDisputeDto) {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: dto.contractId,
        OR: [{ clientId: userId }, { freelancerId: userId }],
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found or you do not have permission');
    }

    if (contract.status === 'COMPLETED' || contract.status === 'CANCELLED') {
      throw new ConflictException('Cannot dispute a completed or cancelled contract');
    }

    const existingDispute = await this.prisma.dispute.findUnique({
      where: { contractId: dto.contractId },
    });

    if (existingDispute) {
      throw new ConflictException('A dispute already exists for this contract');
    }

    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          contractId: dto.contractId,
          raisedById: userId,
          reason: dto.reason,
          evidenceUrls: dto.evidenceUrls || [],
        },
      });

      await tx.contract.update({
        where: { id: dto.contractId },
        data: { status: 'DISPUTED' },
      });

      return dispute;
    });
  }

  // ============================================
  // Escrow Management
  // ============================================

  async fundEscrow(clientId: string, dto: FundEscrowDto) {
    const job = await this.prisma.freelanceJob.findFirst({
      where: {
        id: dto.freelanceJobId,
        clientId,
        status: FreelanceJobStatus.OPEN,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or not eligible for funding');
    }

    const platformFee = dto.platformFee || Math.round(dto.grossAmount * 0.1);
    const netAmount = dto.grossAmount - platformFee;

    return this.prisma.escrowTransaction.create({
      data: {
        freelanceJobId: dto.freelanceJobId,
        grossAmount: dto.grossAmount,
        platformFee,
        netAmount,
        gatewayRef: dto.gatewayRef,
        status: EscrowStatus.FUNDED,
        fundedAt: new Date(),
      },
    });
  }

  async releaseEscrow(clientId: string, dto: ReleaseEscrowDto) {
    const escrow = await this.prisma.escrowTransaction.findFirst({
      where: {
        id: dto.escrowId,
        freelanceJob: {
          clientId,
        },
        status: EscrowStatus.FUNDED,
      },
      include: {
        freelanceJob: {
          include: {
            contract: true,
          },
        },
      },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow transaction not found or not eligible for release');
    }

    if (!escrow.freelanceJob.contract) {
      throw new ConflictException('No contract found for this job');
    }

    const releaseAmount = dto.releaseAmount || escrow.netAmount;

    return this.prisma.$transaction(async (tx) => {
      // Update escrow status
      const updatedEscrow = await tx.escrowTransaction.update({
        where: { id: dto.escrowId },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      // Update freelancer wallet
      await tx.freelancerWallet.upsert({
        where: { userId: escrow.freelanceJob!.contract!.freelancerId },
        update: {
          availableBalance: {
            increment: releaseAmount,
          },
        },
        create: {
          userId: escrow.freelanceJob!.contract!.freelancerId,
          availableBalance: releaseAmount,
        },
      });

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: escrow.freelanceJob!.contract!.freelancerId,
          type: 'CREDIT_AVAILABLE',
          amount: releaseAmount,
          milestoneId: dto.releaseAmount ? undefined : null,
        },
      });

      return updatedEscrow;
    });
  }

  // ============================================
  // Categories
  // ============================================

  async getCategories() {
    return this.prisma.freelanceCategory.findMany({
      orderBy: {
        label: 'asc',
      },
    });
  }

  // Explicitly type the incoming wrapped object
  async createCategory(data: { dto: CreateFrelanceCategoryDto }) {
    const { label, slug, icon } = data.dto;

    if (label === undefined || slug === undefined) {
      throw new BadRequestException('Category label and slug are required');
    }

    return this.prisma.freelanceCategory.create({
      data: {
        label,
        slug,
        icon,
      },
    });
  }
}
