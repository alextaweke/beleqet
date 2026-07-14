// chat/dto/room-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { MessageResponseDto } from './message-response.dto';

export class ParticipantDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  roomId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId!: string;

  @ApiProperty({ example: '2026-07-14T10:00:00.000Z' })
  joinedAt!: string;

  @ApiProperty({ example: '2026-07-14T10:00:00.000Z', nullable: true })
  lastReadAt!: string | null;

  @ApiProperty({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      firstName: 'John',
      lastName: 'Doe',
      avatarUrl: null,
    },
    nullable: true,
  })
  user!: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
}

export class RoomResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  contractId!: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  jobId!: string | null;

  @ApiProperty({ example: '2026-07-14T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-14T10:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ type: [ParticipantDto] })
  participants!: ParticipantDto[];

  @ApiProperty({ type: [MessageResponseDto] })
  messages!: MessageResponseDto[];

  @ApiProperty({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'React Native App Development',
    },
    nullable: true,
  })
  contract?: {
    id: string;
    title: string;
  } | null;

  @ApiProperty({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      firstName: 'Jane',
      lastName: 'Smith',
      avatarUrl: null,
    },
    nullable: true,
  })
  otherParticipant?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;

  @ApiProperty({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      content: 'Last message here',
      createdAt: '2026-07-14T10:00:00.000Z',
      sender: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
    },
    nullable: true,
  })
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
      firstName: string;
      lastName: string;
    } | null;
  } | null;
}
