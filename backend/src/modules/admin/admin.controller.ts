// admin/admin.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsString, MinLength, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { ResolveDisputeDto, SuspendUserDto, ReactivateUserDto } from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================
  // User Management
  // ============================================

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('users/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  async getUserStats() {
    return this.adminService.getUserStats();
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async suspendUser(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Patch('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended user' })
  @ApiResponse({ status: 200, description: 'User reactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async reactivateUser(@Param('id') id: string) {
    return this.adminService.reactivateUser(id);
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle user active status (suspend/reactivate)' })
  @ApiResponse({ status: 200, description: 'User status toggled successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  // ============================================
  // Dispute Management
  // ============================================

  @Get('escrow/disputes')
  @ApiOperation({ summary: 'List all escrow disputes' })
  @ApiResponse({ status: 200, description: 'List of all disputes' })
  async getDisputes() {
    return this.adminService.getDisputes();
  }

  @Get('escrow/disputes/stats')
  @ApiOperation({ summary: 'Get dispute statistics' })
  @ApiResponse({ status: 200, description: 'Dispute statistics' })
  async getDisputeStats() {
    return this.adminService.getDisputeStats();
  }

  @Get('disputes/:id')
  @ApiOperation({ summary: 'Get a single dispute by ID' })
  @ApiResponse({ status: 200, description: 'Dispute details' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async getDispute(@Param('id') id: string) {
    return this.adminService.getDispute(id);
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve an escrow dispute' })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async resolveDispute(@Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.adminService.resolveDispute(id, dto);
  }

  // ============================================
  // Platform Statistics
  // ============================================

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  @ApiResponse({ status: 200, description: 'Platform statistics' })
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('jobs/stats')
  @ApiOperation({ summary: 'Get job statistics' })
  @ApiResponse({ status: 200, description: 'Job statistics' })
  async getJobStats() {
    return this.adminService.getJobStats();
  }
}
