import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto, CreateCompanyDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users') // ✅ This makes the base route /users
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@CurrentUser() u: CurrentUserPayload) {
    return this.svc.findById(u.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() u: CurrentUserPayload, @Body() dto: UpdateUserDto) {
    return this.svc.update(u.userId, dto);
  }

  @Get('company')
  @UseGuards(JwtAuthGuard)
  getCompany(@CurrentUser() u: CurrentUserPayload) {
    return this.svc.getCompany(u.userId);
  }

  @Post('company')
  @UseGuards(JwtAuthGuard)
  createCompany(@CurrentUser() u: CurrentUserPayload, @Body() dto: CreateCompanyDto) {
    return this.svc.createCompany(u.userId, dto);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  notifications(@CurrentUser() u: CurrentUserPayload) {
    return this.svc.getNotifications(u.userId);
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) {
    return this.svc.markNotificationRead(id, u.userId);
  }

  // ✅ Public profile endpoint
  @Get('profile/:id')
  @ApiOperation({ summary: 'Get public user profile by ID' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(@Param('id') id: string) {
    return this.svc.getPublicProfile(id);
  }
}
