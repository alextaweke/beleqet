// chat/dto/typing-event.dto.ts
import { IsBoolean, IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TypingEventDto {
  @ApiProperty({
    description: 'Chat room ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  roomId!: string;

  @ApiProperty({
    description: 'Whether user is typing',
    example: true,
  })
  @IsBoolean()
  isTyping!: boolean;
}
