// freelance/dto/escrow.dto.ts
import { IsUUID, IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EscrowStatus {
  PENDING = 'PENDING',
  FUNDED = 'FUNDED',
  IN_REVIEW = 'IN_REVIEW',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

export class FundEscrowDto {
  @ApiProperty({ description: 'Freelance job ID' })
  @IsUUID()
  freelanceJobId!: string;

  @ApiProperty({ description: 'Gross amount' })
  @IsNumber()
  @Min(0)
  grossAmount!: number;

  @ApiProperty({ description: 'Platform fee' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  platformFee?: number;

  @ApiProperty({ description: 'Gateway reference', required: false })
  @IsString()
  @IsOptional()
  gatewayRef?: string;
}

export class ReleaseEscrowDto {
  @ApiProperty({ description: 'Escrow transaction ID' })
  @IsUUID()
  escrowId!: string;

  @ApiProperty({ description: 'Release amount', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  releaseAmount?: number;
}
