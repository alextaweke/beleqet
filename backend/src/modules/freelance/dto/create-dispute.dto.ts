// freelance/dto/create-dispute.dto.ts
import { IsString, IsUUID, IsArray, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDisputeDto {
  @ApiProperty({ description: 'Contract ID' })
  @IsUUID()
  contractId!: string;

  @ApiProperty({ description: 'Dispute reason' })
  @IsString()
  reason!: string;

  @ApiProperty({ type: [String], description: 'Evidence URLs', required: false })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  evidenceUrls?: string[];
}
