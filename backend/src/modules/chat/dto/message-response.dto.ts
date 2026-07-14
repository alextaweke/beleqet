// chat/dto/message-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  roomId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  senderId!: string;

  @ApiProperty({ example: 'Hello, how are you doing?' })
  content!: string;

  @ApiProperty({ example: false })
  isSystem!: boolean;

  @ApiProperty({ example: '2026-07-14T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      firstName: 'John',
      lastName: 'Doe',
      avatarUrl: null,
    },
    nullable: true,
  })
  sender!: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
}
