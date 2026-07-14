// chat/chat.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

// DTOs with validation
export class CreateRoomDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  contractId?: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId!: string;
}

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  content!: string;
}

export class GetMessagesQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 100;
}

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Get all chat rooms for the current user' })
  @ApiResponse({ status: 200, description: 'List of chat rooms' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRooms(@CurrentUser() user: CurrentUserPayload) {
    return this.chatService.getRoomsForUser(user.userId);
  }

  @Get('rooms/:roomId')
  @ApiOperation({ summary: 'Get a specific chat room by ID' })
  @ApiParam({ name: 'roomId', description: 'Chat room ID' })
  @ApiResponse({ status: 200, description: 'Chat room details' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRoom(@Param('roomId') roomId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.chatService.getRoomInfo(roomId, user.userId);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get messages for a specific room' })
  @ApiParam({ name: 'roomId', description: 'Chat room ID' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async getMessages(
    @Param('roomId') roomId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: GetMessagesQueryDto,
  ) {
    const limit = query.limit || 100;
    return this.chatService.getRoomMessages(roomId, user.userId, limit);
  }

  @Post('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Send a message in a room' })
  @ApiParam({ name: 'roomId', description: 'Chat room ID' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('roomId') roomId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.saveMessage(roomId, user.userId, dto.content);
  }

  @Post('rooms')
  @ApiOperation({ summary: 'Create a new chat room' })
  @ApiResponse({ status: 201, description: 'Room created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createRoom(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateRoomDto) {
    // Prevent creating room with yourself
    if (user.userId === dto.userId) {
      throw new BadRequestException('Cannot create a chat room with yourself');
    }

    return this.chatService.createOrGetRoom(user.userId, dto.userId, dto.contractId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get total unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    return this.chatService.getUnreadCount(user.userId);
  }

  @Post('rooms/:roomId/read')
  @ApiOperation({ summary: 'Mark messages as read in a room' })
  @ApiParam({ name: 'roomId', description: 'Chat room ID' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async markAsRead(@Param('roomId') roomId: string, @CurrentUser() user: CurrentUserPayload) {
    await this.chatService.markMessagesAsRead(roomId, user.userId);
    return { success: true };
  }
}
