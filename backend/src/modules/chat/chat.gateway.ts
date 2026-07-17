// chat/chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config'; // Add this import

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService, // Add this
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`=== New Connection Attempt ===`);
      this.logger.log(`Client ID: ${client.id}`);

      // Try multiple sources for token
      let tokenString = client.handshake.auth?.token;

      if (!tokenString && client.handshake.headers?.authorization) {
        tokenString = client.handshake.headers.authorization as string;
      }

      if (!tokenString && client.handshake.query?.token) {
        tokenString = client.handshake.query.token as string;
      }

      if (!tokenString) {
        this.logger.warn(`❌ No token provided for connection: ${client.id}`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Clean token
      const cleanToken = tokenString.replace('Bearer ', '').trim();
      this.logger.log(`Token length: ${cleanToken.length}`);
      this.logger.log(`Token preview: ${cleanToken.substring(0, 20)}...`);

      // Verify token with explicit secret
      try {
        // Try to verify with the access secret
        const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
        this.logger.log(`Using JWT secret: ${secret ? 'Secret found' : 'Secret not found'}`);

        // Verify the token
        const payload = this.jwtService.verify(cleanToken, {
          secret: secret,
        });

        // DEBUG: Log the full payload
        this.logger.log(`✅ Full JWT Payload: ${JSON.stringify(payload, null, 2)}`);
        this.logger.log(`✅ Payload keys: ${Object.keys(payload).join(', ')}`);

        // Try to find the user ID in any possible field
        const userId = payload.sub || payload.userId || payload.id || payload.user_id;

        this.logger.log(`✅ Extracted userId: ${userId}`);

        if (!userId) {
          this.logger.warn(`❌ No user ID found in token payload`);
          client.emit('error', { message: 'Invalid token: missing user ID' });
          client.disconnect();
          return;
        }

        // Check if user exists in database
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          this.logger.warn(`❌ User not found: ${userId}`);
          client.emit('error', { message: 'User not found' });
          client.disconnect();
          return;
        }

        // Store user data
        client.data.user = payload;
        client.data.userId = userId;

        this.logger.log(`✅ Client connected: ${client.id} (User: ${userId})`);

        // Emit connected event after successful authentication
        client.emit('connected', {
          userId: userId,
          authenticated: true,
          message: 'Successfully connected to chat server',
        });
      } catch (jwtError: any) {
        this.logger.error(`❌ JWT verification failed: ${jwtError.message}`);
        this.logger.error(`JWT Error details:`, jwtError);
        client.emit('error', { message: 'Invalid token: ' + jwtError.message });
        client.disconnect();
        return;
      }
    } catch (err: any) {
      this.logger.error(`❌ Connection error: ${err.message}`);
      this.logger.error(err.stack);
      client.emit('error', { message: 'Connection failed: ' + err.message });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    const roomId = data?.roomId;

    this.logger.log(`📤 join_room request: userId=${userId}, roomId=${roomId}`);

    if (!userId) {
      this.logger.warn(`❌ No userId found in socket data`);
      client.emit('error', { message: 'User not authenticated' });
      return;
    }

    if (!roomId) {
      this.logger.warn(`❌ No roomId provided`);
      client.emit('error', { message: 'Room ID is required' });
      return;
    }

    try {
      // Check if room exists
      const room = await this.prisma.chatRoom.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        this.logger.warn(`❌ Room not found: ${roomId}`);
        client.emit('error', { message: 'Room not found' });
        return;
      }

      // Check if user is a participant
      const isParticipant = await this.chatService.isUserParticipant(roomId, userId);
      this.logger.log(`User ${userId} is participant in room ${roomId}: ${isParticipant}`);

      if (!isParticipant) {
        this.logger.warn(`❌ User ${userId} is not a participant of room ${roomId}`);
        client.emit('error', { message: 'You are not a participant of this room' });
        return;
      }

      // Check if already in room
      const roomSockets = await this.server.in(roomId).fetchSockets();
      const alreadyInRoom = roomSockets.some((s) => s.id === client.id);

      if (alreadyInRoom) {
        this.logger.log(`User ${userId} is already in room ${roomId}`);
        client.emit('room_joined', { roomId, success: true, alreadyJoined: true });
        return;
      }

      // Join the room
      client.join(roomId);
      this.logger.log(`✅ User ${userId} joined room ${roomId}`);

      // Mark messages as read
      await this.chatService.markMessagesAsRead(roomId, userId);

      // Get message history
      const history = await this.chatService.getRoomMessages(roomId, userId, 100);
      this.logger.log(`📜 Sending ${history.length} messages to user ${userId}`);

      client.emit('room_history', { messages: history, roomId });
      client.emit('room_joined', { roomId, success: true });

      // Notify others
      client.to(roomId).emit('user_joined', { userId });
    } catch (err: any) {
      this.logger.error(`❌ Error joining room: ${err.message}`);
      this.logger.error(err.stack);
      client.emit('error', { message: 'Failed to join room: ' + err.message });
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    const roomId = data?.roomId;
    const content = data?.content;

    this.logger.log(`📤 send_message: userId=${userId}, roomId=${roomId}, content="${content}"`);

    if (!userId || !roomId || !content) {
      client.emit('error', { message: 'Missing required fields' });
      return;
    }

    try {
      const isParticipant = await this.chatService.isUserParticipant(roomId, userId);
      if (!isParticipant) {
        client.emit('error', { message: 'You are not a participant of this room' });
        return;
      }

      const savedMsg = await this.chatService.saveMessage(roomId, userId, content.trim());
      this.logger.log(`✅ Message sent in room ${roomId} by user ${userId}`);

      this.server.to(roomId).emit('new_message', savedMsg);
    } catch (err) {
      this.logger.error(`❌ Error sending message: ${(err as Error).message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (!userId || !data?.roomId) return;

    client.to(data.roomId).emit('user_typing', {
      userId,
      isTyping: data.isTyping === true,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (!userId || !data?.roomId) return;

    try {
      await this.chatService.markMessagesAsRead(data.roomId, userId);
      client.to(data.roomId).emit('user_read', { userId });
    } catch (err) {
      this.logger.error(`Error marking read: ${(err as Error).message}`);
    }
  }
}
