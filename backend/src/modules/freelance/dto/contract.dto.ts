// freelance/dto/contract.dto.ts
import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  Min,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
}

export class CreateMilestoneDto {
  @ApiProperty({ description: 'Milestone title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Milestone description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Milestone amount' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ description: 'Milestone deadline' })
  @IsString()
  deadline!: string;

  @ApiProperty({ description: 'Contract ID' })
  @IsUUID()
  contractId!: string;
}

export class CreateContractDto {
  @ApiProperty({ description: 'Freelance job ID' })
  @IsUUID()
  freelanceJobId!: string;

  @ApiProperty({ description: 'Client ID' })
  @IsUUID()
  clientId!: string;

  @ApiProperty({ description: 'Freelancer ID' })
  @IsUUID()
  freelancerId!: string;

  @ApiProperty({ description: 'Agreed amount' })
  @IsNumber()
  @Min(0)
  agreedAmount!: number;
}
