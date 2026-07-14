// chat/chat.service.ts
import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Helper to transform message to DTO
  private transformMessage(message: any) {
    return {
      id: message.id,
      roomId: message.roomId,
      senderId: message.senderId,
      content: message.content,
      isSystem: message.isSystem || false,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender
        ? {
            id: message.sender.id,
            firstName: message.sender.firstName,
            lastName: message.sender.lastName,
            avatarUrl: message.sender.avatarUrl,
          }
        : null,
    };
  }

  // Helper to transform room to DTO
  private transformRoom(room: any) {
    const participants = room.participants || [];
    const otherParticipant = participants.find((p: any) => p.userId !== room.currentUserId);

    return {
      id: room.id,
      contractId: room.contractId,
      jobId: room.jobId || null,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
      participants: participants.map((p: any) => ({
        id: p.id,
        roomId: p.roomId,
        userId: p.userId,
        joinedAt: p.joinedAt.toISOString(),
        lastReadAt: p.lastReadAt?.toISOString() || null,
        user: p.user
          ? {
              id: p.user.id,
              firstName: p.user.firstName,
              lastName: p.user.lastName,
              avatarUrl: p.user.avatarUrl,
            }
          : null,
      })),
      otherParticipant: otherParticipant?.user || null,
      lastMessage:
        room.messages?.length > 0
          ? {
              id: room.messages[0].id,
              content: room.messages[0].content,
              createdAt: room.messages[0].createdAt.toISOString(),
              sender: room.messages[0].sender
                ? {
                    firstName: room.messages[0].sender.firstName,
                    lastName: room.messages[0].sender.lastName,
                  }
                : null,
            }
          : null,
      contract: room.contract
        ? {
            id: room.contract.id,
            freelanceJob: room.contract.freelanceJob
              ? {
                  id: room.contract.freelanceJob.id,
                  title: room.contract.freelanceJob.title,
                }
              : null,
          }
        : null,
    };
  }

  // Get all rooms for a user
  async getRoomsForUser(userId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const participants = await this.prisma.chatParticipant.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            participants: {
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
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            contract: {
              include: {
                freelanceJob: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        room: {
          updatedAt: 'desc',
        },
      },
    });

    // Transform and filter rooms
    const rooms = participants.map((p) => {
      const room = p.room;
      return this.transformRoom({
        ...room,
        currentUserId: userId,
      });
    });

    return rooms;
  }

  // Get a specific room (with security check)
  async getRoomInfo(roomId: string, userId: string) {
    // First verify the room exists
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: {
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
        },
        contract: {
          include: {
            freelanceJob: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    // Security: Check if user is a participant
    const isParticipant = room.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('You do not have access to this chat room');
    }

    // Get last message for preview
    const lastMessage = await this.prisma.message.findFirst({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.transformRoom({
      ...room,
      messages: lastMessage ? [lastMessage] : [],
      currentUserId: userId,
    });
  }

  // Get messages for a room (with security check)
  async getRoomMessages(roomId: string, userId: string, take = 50) {
    // Verify room exists
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    // Verify user is a participant
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException('You do not have access to this chat room');
    }

    const messages = await this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return messages.map((m) => this.transformMessage(m));
  }

  // Save a message (with security check)
  async saveMessage(roomId: string, senderId: string, content: string) {
    // Validate input
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    // Verify room exists
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    // Verify user is a participant
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { roomId_userId: { roomId, userId: senderId } },
    });
    if (!participant) {
      throw new ForbiddenException('You are not a participant of this chat room');
    }

    const message = await this.prisma.message.create({
      data: {
        roomId,
        senderId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update room's updatedAt
    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    return this.transformMessage(message);
  }

  // Create or get room (with security check)
  async createOrGetRoom(userId1: string, userId2: string, contractId?: string) {
    // Validate users are different
    if (userId1 === userId2) {
      throw new BadRequestException('Cannot create a chat room with yourself');
    }

    // Verify both users exist
    const users = await this.prisma.user.findMany({
      where: { id: { in: [userId1, userId2] } },
    });
    if (users.length !== 2) {
      throw new NotFoundException('One or both users not found');
    }

    // Check if room already exists for this contract
    if (contractId) {
      const existingRoom = await this.prisma.chatRoom.findUnique({
        where: { contractId },
        include: {
          participants: {
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
          },
        },
      });

      if (existingRoom) {
        // Verify both users are participants
        const participantIds = existingRoom.participants.map((p) => p.userId);
        if (!participantIds.includes(userId1) || !participantIds.includes(userId2)) {
          throw new ForbiddenException('Users are not participants of this room');
        }
        return this.transformRoom({
          ...existingRoom,
          currentUserId: userId1,
        });
      }
    }

    // Create new room
    const room = await this.prisma.chatRoom.create({
      data: {
        contractId: contractId || null,
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
      include: {
        participants: {
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
        },
      },
    });

    this.logger.log(`Created new ChatRoom ${room.id}`);
    return this.transformRoom({
      ...room,
      currentUserId: userId1,
    });
  }

  // Check if user is a participant
  async isUserParticipant(roomId: string, userId: string): Promise<boolean> {
    // Verify room exists
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      return false;
    }

    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });
    return !!participant;
  }

  // Mark messages as read (with security check)
  async markMessagesAsRead(roomId: string, userId: string) {
    // Verify room exists
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    const participant = await this.prisma.chatParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException('You are not a participant of this chat room');
    }

    return this.prisma.chatParticipant.update({
      where: { roomId_userId: { roomId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  // Get unread count (optimized)
  async getUnreadCount(userId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const participants = await this.prisma.chatParticipant.findMany({
      where: { userId },
      select: {
        roomId: true,
        lastReadAt: true,
      },
    });

    if (participants.length === 0) {
      return { unreadCount: 0 };
    }

    let totalUnread = 0;
    for (const p of participants) {
      const whereClause: any = {
        roomId: p.roomId,
        senderId: { not: userId },
      };

      if (p.lastReadAt) {
        whereClause.createdAt = { gt: p.lastReadAt };
      }

      const count = await this.prisma.message.count({
        where: whereClause,
      });
      totalUnread += count;
    }

    return { unreadCount: totalUnread };
  }
}
