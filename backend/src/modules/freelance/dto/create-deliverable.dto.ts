// freelance/dto/create-deliverable.dto.ts
import { IsString, IsOptional, IsUUID, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeliverableDto {
  @ApiProperty({ description: 'Deliverable title' })
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Deliverable description' })
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Deliverable URL', required: false })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiProperty({ description: 'Milestone ID' })
  @IsUUID()
  milestoneId?: string;
}
