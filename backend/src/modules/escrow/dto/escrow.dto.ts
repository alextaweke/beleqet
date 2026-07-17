// backend/src/modules/escrow/dto/escrow.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class InitiateEscrowDto {
  @ApiProperty({ description: 'Gig ID' })
  gigId!: string;
}

export class ReleaseEscrowDto {
  @ApiProperty({ description: 'Escrow ID' })
  escrowId!: string;

  @ApiProperty({ required: false, description: 'Amount to release (optional)' })
  releaseAmount?: number;
}

export class FundEscrowDto {
  @ApiProperty({ description: 'Freelance Job ID' })
  freelanceJobId!: string;

  @ApiProperty({ description: 'Gross amount to fund' })
  grossAmount!: number;

  @ApiProperty({ required: false, description: 'Platform fee (default: 10%)' })
  platformFee?: number;

  @ApiProperty({ required: false, description: 'Gateway reference' })
  gatewayRef?: string;
}

export class WebhookPayloadDto {
  @ApiProperty({ description: 'Transaction reference' })
  reference!: string;

  @ApiProperty({ description: 'Transaction status' })
  status!: string;

  @ApiProperty({ required: false, description: 'Transaction amount' })
  amount?: number;

  @ApiProperty({ required: false, description: 'Currency' })
  currency?: string;

  @ApiProperty({ required: false, description: 'Transaction reference from Chapa' })
  tx_ref?: string;
}
