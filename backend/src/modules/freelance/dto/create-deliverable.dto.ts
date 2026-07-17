// freelance/dto/create-deliverable.dto.ts
import { IsString, IsOptional, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeliverableDto {
  @ApiProperty({ description: 'File URL', required: true })
  @IsUrl()
  @IsNotEmpty()
  fileUrl!: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
