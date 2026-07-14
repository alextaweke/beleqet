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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JobsService } from './jobs.service';
import { CreateJobDto, QueryJobsDto } from './dto/create-job.dto';
import { CreateJobCategoryDto } from './dto/create-category.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly svc: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Search & browse job listings (public)' })
  findAll(@Query() query: QueryJobsDto) {
    return this.svc.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current employer jobs list and active quotas' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        jobs: { type: 'array', items: { $ref: '#/components/schemas/Job' } },
        totalCount: { type: 'number', description: 'Total jobs created' },
        activeCount: { type: 'number', description: 'Total published jobs' },
        allowedLimit: { type: 'number', description: 'Maximum active jobs allowed' },
        canPostMore: {
          type: 'boolean',
          description: 'True if activeCount is less than allowedLimit',
        },
      },
    },
  })
  async myJobs(@CurrentUser() user: CurrentUserPayload) {
    return await this.svc.findByCompany(user.userId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all job categories' })
  getCategories() {
    return this.svc.getCategories();
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('categories') // <-- FIXED: Added explicit path 'categories' (Maps to POST /jobs/categories)
  @ApiOperation({ summary: 'Create a job category (admin only)' })
  @ApiCreatedResponse({
    description: 'The category has been successfully created.',
    type: CreateJobCategoryDto,
  })
  createCategory(@Body() dto: CreateJobCategoryDto) {
    return this.svc.createCategory(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a job listing (employer only)' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateJobDto) {
    return this.svc.create(user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER', 'ADMIN')
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: Partial<CreateJobDto>,
  ) {
    return this.svc.update(id, user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER', 'ADMIN')
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.remove(id, user.userId);
  }
}
