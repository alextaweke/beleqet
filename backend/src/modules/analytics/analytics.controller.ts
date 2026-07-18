// backend/src/modules/analytics/analytics.controller.ts
import { Controller, Get, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  // ── DASHBOARD OVERVIEW (Role-based) ──────────────────────────────────────

  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Get dashboard overview based on user role' })
  @ApiResponse({ status: 200, description: 'Dashboard overview data' })
  async getDashboardOverview(@CurrentUser() user: CurrentUserPayload) {
    return this.svc.getDashboardOverview(user.userId, user.role);
  }

  // ── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

  @Get('admin/overview')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get overview statistics (Admin only)' })
  getAdminOverview() {
    return this.svc.getAdminOverviewStats();
  }

  @Get('admin/jobs')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get job analytics (Admin only)' })
  getAdminJobAnalytics(@Query('period') period: 'day' | 'week' | 'month' = 'month') {
    return this.svc.getAdminJobAnalytics(period);
  }

  @Get('admin/users')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get user analytics (Admin only)' })
  getAdminUserAnalytics() {
    return this.svc.getAdminUserAnalytics();
  }

  @Get('admin/freelance')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get freelance analytics (Admin only)' })
  getAdminFreelanceAnalytics(@Query('period') period: 'day' | 'week' | 'month' = 'month') {
    return this.svc.getAdminFreelanceAnalytics(period);
  }

  @Get('admin/escrow')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get escrow analytics (Admin only)' })
  getAdminEscrowAnalytics() {
    return this.svc.getAdminEscrowAnalytics();
  }

  // ── EMPLOYER ENDPOINTS ─────────────────────────────────────────────────────

  @Get('employer/overview')
  @ApiOperation({ summary: 'Get employer overview stats' })
  getEmployerOverview(@CurrentUser() user: CurrentUserPayload) {
    return this.svc.getEmployerOverviewStats(user.userId);
  }

  @Get('employer/jobs')
  @ApiOperation({ summary: 'Get employer job analytics' })
  getEmployerJobAnalytics(
    @CurrentUser() user: CurrentUserPayload,
    @Query('period') period: 'day' | 'week' | 'month' = 'month',
  ) {
    return this.svc.getEmployerJobAnalytics(user.userId, period);
  }

  @Get('employer/applications')
  @ApiOperation({ summary: 'Get employer application analytics' })
  getEmployerApplicationAnalytics(
    @CurrentUser() user: CurrentUserPayload,
    @Query('period') period: 'day' | 'week' | 'month' = 'month',
  ) {
    return this.svc.getEmployerApplicationAnalytics(user.userId, period);
  }

  // ── JOB SEEKER / FREELANCER ENDPOINTS ─────────────────────────────────────

  @Get('user/overview')
  @ApiOperation({ summary: 'Get user overview stats' })
  getUserOverview(@CurrentUser() user: CurrentUserPayload) {
    return this.svc.getUserOverviewStats(user.userId);
  }

  @Get('user/applications')
  @ApiOperation({ summary: 'Get user application analytics' })
  getUserApplicationAnalytics(
    @CurrentUser() user: CurrentUserPayload,
    @Query('period') period: 'day' | 'week' | 'month' = 'month',
  ) {
    return this.svc.getUserApplicationAnalytics(user.userId, period);
  }

  @Get('user/bids')
  @ApiOperation({ summary: 'Get user bid analytics' })
  getUserBidAnalytics(
    @CurrentUser() user: CurrentUserPayload,
    @Query('period') period: 'day' | 'week' | 'month' = 'month',
  ) {
    return this.svc.getUserBidAnalytics(user.userId, period);
  }

  @Get('user/earnings')
  @ApiOperation({ summary: 'Get user earnings analytics' })
  getUserEarningsAnalytics(@CurrentUser() user: CurrentUserPayload) {
    return this.svc.getUserEarningsAnalytics(user.userId);
  }

  // ── FREELANCER SPECIFIC ────────────────────────────────────────────────────

  @Get('freelancer/contracts')
  @ApiOperation({ summary: 'Get freelancer contract analytics' })
  getFreelancerContractAnalytics(@CurrentUser() user: CurrentUserPayload) {
    return this.svc.getFreelancerContractAnalytics(user.userId);
  }

  @Get('freelancer/portfolio')
  @ApiOperation({ summary: 'Get freelancer portfolio analytics' })
  getFreelancerPortfolioAnalytics(@CurrentUser() user: CurrentUserPayload) {
    return this.svc.getFreelancerPortfolioAnalytics(user.userId);
  }
}
