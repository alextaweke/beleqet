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
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { PortfolioService } from './portfolio.service';
import {
  CreateProjectDto,
  CreateWorkHistoryDto,
  CreateTestimonialDto,
  CreateCertificationDto,
} from './dto/create-portfolio.dto';

@ApiTags('portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly svc: PortfolioService) {}

  // ── PROJECTS ──────────────────────────────────────────────────────────
  @Post('projects')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createProject(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateProjectDto) {
    return this.svc.createProject(user.userId, dto);
  }

  @Get('projects')
  getProjects(@Query('userId') userId?: string) {
    return this.svc.getProjects(userId);
  }

  @Get('projects/:id')
  getProject(@Param('id') id: string) {
    return this.svc.getProjectById(id);
  }

  @Patch('projects/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateProject(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: Partial<CreateProjectDto>,
  ) {
    return this.svc.updateProject(id, user.userId, dto);
  }

  @Delete('projects/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteProject(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.deleteProject(id, user.userId);
  }

  // ── WORK HISTORY ──────────────────────────────────────────────────────
  @Post('work-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createWorkHistory(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateWorkHistoryDto) {
    return this.svc.createWorkHistory(user.userId, dto);
  }

  @Get('work-history/:userId')
  getWorkHistory(@Param('userId') userId: string) {
    return this.svc.getWorkHistory(userId);
  }

  @Patch('work-history/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateWorkHistory(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: Partial<CreateWorkHistoryDto>,
  ) {
    return this.svc.updateWorkHistory(id, user.userId, dto);
  }

  @Delete('work-history/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteWorkHistory(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.deleteWorkHistory(id, user.userId);
  }

  // ── TESTIMONIALS ──────────────────────────────────────────────────────
  @Post('testimonials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createTestimonial(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateTestimonialDto) {
    return this.svc.createTestimonial(user.userId, dto);
  }

  @Get('testimonials/:userId')
  getTestimonials(@Param('userId') userId: string, @Query('public') isPublic: string = 'true') {
    return this.svc.getTestimonials(userId, isPublic === 'true');
  }

  @Delete('testimonials/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteTestimonial(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.deleteTestimonial(id, user.userId);
  }

  // ── CERTIFICATIONS ────────────────────────────────────────────────────
  @Post('certifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createCertification(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCertificationDto,
  ) {
    return this.svc.createCertification(user.userId, dto);
  }

  @Get('certifications/:userId')
  getCertifications(@Param('userId') userId: string) {
    return this.svc.getCertifications(userId);
  }

  @Patch('certifications/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateCertification(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: Partial<CreateCertificationDto>,
  ) {
    return this.svc.updateCertification(id, user.userId, dto);
  }

  @Delete('certifications/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteCertification(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.deleteCertification(id, user.userId);
  }

  // ── COMPLETE PORTFOLIO ──────────────────────────────────────────────
  @Get('full/:userId')
  getFullPortfolio(@Param('userId') userId: string) {
    return this.svc.getFullPortfolio(userId);
  }
}
