// backend/src/modules/search/search.controller.ts
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly svc: SearchService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'Search jobs' })
  @ApiResponse({ status: 200, description: 'Search results' })
  searchJobs(
    @Query('q') query: string,
    @Query('location') location?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('minSalary') minSalary?: string,
    @Query('maxSalary') maxSalary?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.searchJobs(query, {
      location,
      type,
      category,
      minSalary: minSalary ? parseInt(minSalary) : undefined,
      maxSalary: maxSalary ? parseInt(maxSalary) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('freelance')
  @ApiOperation({ summary: 'Search freelance jobs' })
  @ApiResponse({ status: 200, description: 'Search results' })
  searchFreelance(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string,
    @Query('skills') skills?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const skillsArray = skills ? skills.split(',') : undefined;
    return this.svc.searchFreelanceJobs(query, {
      category,
      minBudget: minBudget ? parseInt(minBudget) : undefined,
      maxBudget: maxBudget ? parseInt(maxBudget) : undefined,
      skills: skillsArray,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete search' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions' })
  autocomplete(@Query('q') query: string, @Query('type') type: 'jobs' | 'freelance' = 'jobs') {
    return this.svc.autocomplete(query, type);
  }

  @Get('health')
  @ApiOperation({ summary: 'Search service health check' })
  @ApiResponse({ status: 200, description: 'Health status' })
  healthCheck() {
    return this.svc.healthCheck();
  }

  @Post('reindex')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger reindex (Admin only)' })
  @ApiResponse({ status: 200, description: 'Reindex triggered' })
  reindex(@Body() body: { entityType: 'job' | 'freelance_job'; batchSize?: number }) {
    return this.svc.bulkIndex(body.entityType, body.batchSize || 100);
  }
}
