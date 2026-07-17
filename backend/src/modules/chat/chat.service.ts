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

  private transformRoom(room: any) {
    const participants = room.participants || [];

    const otherParticipant = participants.find((p: any) => p.userId !== room.currentUserId);

    return {
      id: room.id,
      contractId: room.contractId,
      // jobId: room.jobId

      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),

      participants: participants.map((p: any) => ({
        id: p.id,
        roomId: p.roomId,
        userId: p.userId,
        joinedAt: p.joinedAt.toISOString(),
        lastReadAt: p.lastReadAt ? p.lastReadAt.toISOString() : null,

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
        room.messages && room.messages.length > 0
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
    };
  }

  async getRoomsForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const participants = await this.prisma.chatParticipant.findMany({
      where: {
        userId,
      },

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
              orderBy: {
                createdAt: 'desc',
              },
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
          },
        },
      },

      orderBy: {
        room: {
          updatedAt: 'desc',
        },
      },
    });

    return participants.map((p) => {
      return this.transformRoom({
        ...p.room,
        currentUserId: userId,
      });
    });
  }

  async getRoomInfo(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: {
        id: roomId,
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

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    const isParticipant = room.participants.some((p) => p.userId === userId);

    if (!isParticipant) {
      throw new ForbiddenException('You do not have access to this chat room');
    }

    const lastMessage = await this.prisma.message.findFirst({
      where: {
        roomId,
      },

      orderBy: {
        createdAt: 'desc',
      },

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

  async getRoomMessages(roomId: string, userId: string, take = 50) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not participant');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
      },

      orderBy: {
        createdAt: 'asc',
      },

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

  async saveMessage(roomId: string, senderId: string, content: string) {
    if (!content.trim()) {
      throw new BadRequestException('Message cannot be empty');
    }

    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: senderId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('Not a participant');
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

    await this.prisma.chatRoom.update({
      where: {
        id: roomId,
      },

      data: {
        updatedAt: new Date(),
      },
    });

    return this.transformMessage(message);
  }

  async createOrGetRoom(userId1: string, userId2: string, contractId?: string) {
    if (userId1 === userId2) {
      throw new BadRequestException('Cannot chat yourself');
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: [userId1, userId2],
        },
      },
    });

    if (users.length !== 2) {
      throw new NotFoundException('Users not found');
    }

    if (contractId) {
      const existing = await this.prisma.chatRoom.findUnique({
        where: {
          contractId,
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

      if (existing) {
        return this.transformRoom({
          ...existing,

          currentUserId: userId1,
        });
      }
    }

    const room = await this.prisma.chatRoom.create({
      data: {
        contractId: contractId || null,

        participants: {
          create: [
            {
              userId: userId1,
            },
            {
              userId: userId2,
            },
          ],
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

    this.logger.log(`Created room ${room.id}`);

    return this.transformRoom({
      ...room,

      currentUserId: userId1,
    });
  }

  async isUserParticipant(roomId: string, userId: string) {
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

  async markMessagesAsRead(roomId: string, userId: string) {
    return this.prisma.chatParticipant.update({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },

      data: {
        lastReadAt: new Date(),
      },
    });
  }

  async getUnreadCount(userId: string) {
    const participants = await this.prisma.chatParticipant.findMany({
      where: {
        userId,
      },

      select: {
        roomId: true,
        lastReadAt: true,
      },
    });

    let total = 0;

    for (const p of participants) {
      total += await this.prisma.message.count({
        where: {
          roomId: p.roomId,

          senderId: {
            not: userId,
          },

          ...(p.lastReadAt && {
            createdAt: {
              gt: p.lastReadAt,
            },
          }),
        },
      });
    }

    return {
      unreadCount: total,
    };
  }
}
