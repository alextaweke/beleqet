// backend/src/modules/escrow/dto/index.ts

export class InitiateEscrowDto {
  gigId!: string;
}

export class ReleaseEscrowDto {
  escrowId!: string;
  releaseAmount?: number;
}

export class FundEscrowDto {
  freelanceJobId!: string;
  grossAmount!: number;
  platformFee?: number;
  gatewayRef?: string;
}

export class WebhookPayloadDto {
  reference!: string;
  status!: string;
  amount?: number;
  currency?: string;
  tx_ref?: string;
  [key: string]: unknown;
}
