// freelance/freelance.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
  Roles,
} from '../../common/decorators/current-user.decorator';
import { FreelanceService } from './freelance.service';
import {
  CreateFreelanceJobDto,
  CreateBidDto,
  QueryFreelanceJobsDto,
  FreelanceJobStatus,
  BidStatus,
  CreateMilestoneDto,
  CreateDisputeDto,
  FundEscrowDto,
  ReleaseEscrowDto,
} from './dto';
import { CreateFrelanceCategoryDto } from './dto/create-category.dto';
import { RolesGuard } from '@common/guards/roles.guard';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';
@ApiTags('freelance')
@Controller('freelance')
export class FreelanceController {
  constructor(private readonly svc: FreelanceService) {}

  // ============================================
  // Jobs
  // ============================================

  @Get('jobs')
  @ApiOperation({ summary: 'Get all freelance jobs' })
  @ApiResponse({ status: 200, description: 'List of freelance jobs' })
  findJobs(@Query() query: QueryFreelanceJobsDto) {
    return this.svc.findJobs(query);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get freelance job by ID' })
  @ApiResponse({ status: 200, description: 'Freelance job details' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findJob(@Param('id') id: string) {
    return this.svc.findJobById(id);
  }

  @Post('jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a freelance job (Employer only)' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Employer only' })
  createJob(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateFreelanceJobDto) {
    return this.svc.createJob(user.userId, dto);
  }

  @Patch('jobs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a freelance job (Employer only)' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Employer only' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  updateJob(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: Partial<CreateFreelanceJobDto>,
  ) {
    return this.svc.updateJob(id, user.userId, dto);
  }

  @Delete('jobs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a freelance job (Employer only)' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Employer only' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  deleteJob(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.deleteJob(id, user.userId);
  }

  // ============================================
  // Bids
  // ============================================

  @Post('jobs/:id/bids')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a bid (Freelancer only)' })
  @ApiResponse({ status: 201, description: 'Bid submitted successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 409, description: 'Bid already exists' })
  submitBid(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBidDto,
  ) {
    return this.svc.submitBid(user.userId, id, dto);
  }

  @Patch('bids/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a bid (Client only)' })
  @ApiResponse({ status: 200, description: 'Bid accepted successfully' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  @ApiResponse({ status: 409, description: 'Bid already processed' })
  acceptBid(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.acceptBid(id, user.userId);
  }

  @Patch('bids/:id/withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw a bid (Freelancer only)' })
  @ApiResponse({ status: 200, description: 'Bid withdrawn successfully' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  @ApiResponse({ status: 409, description: 'Bid already processed' })
  withdrawBid(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.withdrawBid(id, user.userId);
  }

  @Get('my-bids')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's bids (Freelancer only)" })
  @ApiResponse({ status: 200, description: "List of user's bids" })
  myBids(@CurrentUser() user: CurrentUserPayload) {
    return this.svc.getMyBids(user.userId);
  }

  // ============================================
  // Contracts
  // ============================================

  // freelance/freelance.controller.ts - Update getContract endpoint

  @Get('contracts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiResponse({ status: 200, description: 'Contract details' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getContract(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.getContract(id);
  }

  @Get('my-contracts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's contracts" })
  @ApiResponse({ status: 200, description: "List of user's contracts" })
  getMyContracts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('role') role: 'client' | 'freelancer',
  ) {
    return this.svc.getMyContracts(user.userId, role);
  }

  // ============================================
  // Milestones
  // ============================================

  @Post('milestones')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a milestone (Client only)' })
  @ApiResponse({ status: 201, description: 'Milestone created successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  createMilestone(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateMilestoneDto) {
    return this.svc.createMilestone(user.userId, dto);
  }

  @Patch('milestones/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a milestone (Client only)' })
  @ApiResponse({ status: 200, description: 'Milestone approved successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 409, description: 'Milestone already approved' })
  approveMilestone(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.approveMilestone(id, user.userId);
  }

  // freelance/freelance.controller.ts

  @Post('milestones/:id/deliverables')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a deliverable (Freelancer only)' })
  @ApiResponse({ status: 201, description: 'Deliverable submitted successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  submitDeliverable(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateDeliverableDto,
  ) {
    // Pass all 3 arguments: milestoneId, freelancerId, dto
    return this.svc.submitDeliverable(id, user.userId, dto);
  }
  // ============================================
  // Disputes
  // ============================================

  @Post('disputes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a dispute (Client or Freelancer)' })
  @ApiResponse({ status: 201, description: 'Dispute created successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  @ApiResponse({ status: 409, description: 'Dispute already exists' })
  createDispute(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateDisputeDto) {
    return this.svc.createDispute(user.userId, dto);
  }

  // ============================================
  // Escrow
  // ============================================

  @Post('escrow/fund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fund escrow (Client only)' })
  @ApiResponse({ status: 201, description: 'Escrow funded successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  fundEscrow(@CurrentUser() user: CurrentUserPayload, @Body() dto: FundEscrowDto) {
    return this.svc.fundEscrow(user.userId, dto);
  }

  @Post('escrow/release')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release escrow (Client only)' })
  @ApiResponse({ status: 200, description: 'Escrow released successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Escrow not found' })
  releaseEscrow(@CurrentUser() user: CurrentUserPayload, @Body() dto: ReleaseEscrowDto) {
    return this.svc.releaseEscrow(user.userId, dto);
  }

  // ============================================
  // Categories
  // ============================================

  @Get('categories')
  @ApiOperation({ summary: 'Get all freelance categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  getCategories() {
    return this.svc.getCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new freelance category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  createCategory(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateFrelanceCategoryDto) {
    return this.svc.createCategory({ dto });
  }
}
