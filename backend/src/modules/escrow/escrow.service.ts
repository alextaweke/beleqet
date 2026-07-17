import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES, ESCROW_JOBS } from '../queues/queues.constants';

const PLATFORM_FEE_PCT = 0.1;

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_NAMES.ESCROW) private readonly escrowQueue: Queue,
  ) {}

  /** Initiate escrow — returns Chapa/Telebirr payment link */
  async initiate(clientId: string, freelanceJobId: string) {
    const job = await this.prisma.freelanceJob.findFirst({
      where: { id: freelanceJobId, clientId },
      include: {
        client: true,
        contract: true,
        escrowTx: true,
      },
    });
    if (!job) throw new NotFoundException('Gig not found');

    // Check if escrow already exists
    if (job.escrowTx) {
      this.logger.log(`Escrow already exists for job ${freelanceJobId}: ${job.escrowTx.id}`);

      if (job.escrowTx.status === 'PENDING') {
        const checkoutUrl = `${this.config.get('FRONTEND_URL')}/freelance/pay?gig=${freelanceJobId}`;
        return {
          escrowId: job.escrowTx.id,
          checkoutUrl,
          grossAmount: job.escrowTx.grossAmount,
          platformFee: job.escrowTx.platformFee,
          netAmount: job.escrowTx.netAmount,
          existing: true,
        };
      }

      if (job.escrowTx.status === 'FUNDED') {
        throw new BadRequestException('This gig already has funded escrow.');
      }

      throw new BadRequestException(
        `Cannot initiate escrow. Current status: ${job.escrowTx.status}`,
      );
    }

    // Use the agreed contract amount if a contract exists
    const grossAmount = job.contract ? job.contract.agreedAmount : job.budgetMax;
    if (!job.contract) {
      this.logger.warn(
        `Escrow initiated without a contract for job ${freelanceJobId} — using budgetMax.`,
      );
    }

    const platformFee = Math.round(grossAmount * PLATFORM_FEE_PCT);
    const netAmount = grossAmount - platformFee;

    // Create new escrow
    const escrow = await this.prisma.escrowTransaction.create({
      data: {
        freelanceJobId,
        grossAmount,
        platformFee,
        netAmount,
        status: 'PENDING',
      },
    });

    // Default checkout URL (fallback)
    let checkoutUrl = `${this.config.get('FRONTEND_URL')}/freelance/pay?gig=${freelanceJobId}`;

    // Try to initialize Chapa payment
    const chapaSecret = this.config.get<string>('CHAPA_SECRET_KEY');
    this.logger.log(`Chapa Secret Key configured: ${!!chapaSecret}`);

    if (chapaSecret) {
      try {
        this.logger.log(`💰 Initializing Chapa payment for ETB ${grossAmount}`);

        // Get the callback URL from env
        const callbackUrl = this.config.get<string>('CHAPA_CALLBACK_URL');
        const returnUrl = this.config.get<string>('CHAPA_RETURN_URL');

        // Clean the description - remove special characters
        const cleanDescription = job.title
          .replace(/[^a-zA-Z0-9\s\-_.]/g, ' ') // Remove special characters
          .replace(/\s+/g, ' ') // Remove extra spaces
          .trim()
          .substring(0, 50); // Limit to 50 characters

        this.logger.log(`📤 Clean description: ${cleanDescription}`);

        const requestBody = {
          amount: grossAmount.toString(),
          currency: 'ETB',
          email: job.client.email,
          first_name: job.client.firstName,
          last_name: job.client.lastName,
          tx_ref: escrow.id,
          callback_url: callbackUrl || `https://webhook.site/${escrow.id}`,
          return_url: returnUrl || `${this.config.get('FRONTEND_URL')}/payment-success`,
          customization: {
            title: 'Beleqet Escrow',
            description: cleanDescription || 'Payment for Freelance Work',
          },
        };

        this.logger.log(`📤 Chapa Request Body: ${JSON.stringify(requestBody, null, 2)}`);

        const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${chapaSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const responseText = await response.text();
        this.logger.log(`📥 Chapa Response Status: ${response.status}`);
        this.logger.log(`📥 Chapa Response Body: ${responseText}`);

        // Try to parse the response
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          this.logger.error(`❌ Failed to parse Chapa response: ${responseText}`);
          const errorMsg = encodeURIComponent(
            `Failed to parse response: ${responseText.substring(0, 100)}`,
          );
          checkoutUrl = `${this.config.get('FRONTEND_URL')}/payment-success?escrow=${escrow.id}&test=true&error=${errorMsg}`;
          return {
            escrowId: escrow.id,
            checkoutUrl,
            grossAmount,
            platformFee,
            netAmount,
            existing: false,
          };
        }

        // Log the full response data
        this.logger.log(`📊 Chapa Response Data: ${JSON.stringify(data, null, 2)}`);

        // Check if the response was successful
        if (data.status === 'success' && data.data?.checkout_url) {
          checkoutUrl = data.data.checkout_url;
          this.logger.log(`✅ Chapa checkout URL: ${checkoutUrl}`);
        } else {
          // Get the error message from Chapa
          let errorMsg = 'Unknown Chapa error';

          if (data.message) {
            if (typeof data.message === 'string') {
              errorMsg = data.message;
            } else if (typeof data.message === 'object') {
              // Handle nested error messages
              const messages = [];
              for (const [key, value] of Object.entries(data.message)) {
                if (Array.isArray(value)) {
                  messages.push(`${key}: ${value.join(', ')}`);
                } else {
                  messages.push(`${key}: ${value}`);
                }
              }
              errorMsg = messages.join('; ');
            }
          } else if (data.error) {
            errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
          }

          this.logger.error(`❌ Chapa error: ${errorMsg}`);
          this.logger.error(`❌ Full response: ${JSON.stringify(data)}`);

          checkoutUrl = `${this.config.get('FRONTEND_URL')}/payment-success?escrow=${escrow.id}&test=true&error=${encodeURIComponent(errorMsg)}`;
        }
      } catch (err) {
        // Catch any other errors
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        this.logger.error(`❌ Failed to reach Chapa: ${errorMessage}`);
        this.logger.error(`❌ Error stack: ${err instanceof Error ? err.stack : 'No stack'}`);

        checkoutUrl = `${this.config.get('FRONTEND_URL')}/payment-success?escrow=${escrow.id}&test=true&error=${encodeURIComponent(errorMessage)}`;
      }
    } else {
      this.logger.warn('⚠️ CHAPA_SECRET_KEY is not configured. Using test redirect.');
      checkoutUrl = `${this.config.get('FRONTEND_URL')}/payment-success?escrow=${escrow.id}&test=true&error=${encodeURIComponent('CHAPA_SECRET_KEY not configured')}`;
    }

    this.logger.log(
      `Escrow initiated: ${escrow.id} for job ${freelanceJobId} — amount: ETB ${grossAmount}`,
    );
    this.logger.log(`Final checkout URL: ${checkoutUrl}`);

    return {
      escrowId: escrow.id,
      checkoutUrl,
      grossAmount,
      platformFee,
      netAmount,
      existing: false,
    };
  }

  /** Called by Chapa webhook — adds webhook to queue for processing */
  async handleWebhook(payload: {
    reference?: string;
    status?: string;
    tx_ref?: string;
    [k: string]: unknown;
  }) {
    this.logger.log(`📨 Webhook received: ${JSON.stringify(payload, null, 2)}`);

    // Extract reference from possible fields
    const reference = payload.reference || payload.tx_ref || payload.ref;
    const status = payload.status || payload.state || payload.payment_status;

    this.logger.log(`📊 Extracted - Reference: ${reference}, Status: ${status}`);

    if (!reference) {
      this.logger.error('❌ No reference found in webhook payload');
      // Still try to process with tx_ref
      if (payload.tx_ref) {
        this.logger.log(`🔄 Using tx_ref: ${payload.tx_ref}`);
        await this.escrowQueue.add(ESCROW_JOBS.PROCESS_WEBHOOK, {
          reference: payload.tx_ref,
          status: status || 'unknown',
          ...payload,
        });
        return { received: true, warning: 'Used tx_ref as reference' };
      }
      throw new BadRequestException('Missing reference in webhook');
    }

    if (!status) {
      this.logger.error('❌ No status found in webhook payload');
      throw new BadRequestException('Missing status in webhook');
    }

    // Add to queue with normalized payload
    await this.escrowQueue.add(ESCROW_JOBS.PROCESS_WEBHOOK, {
      reference,
      status,
      ...payload,
    });

    this.logger.log(`✅ Webhook queued for processing: ${reference}`);
    return { received: true };
  }

  /** Called when employer approves milestone */
  async releaseMilestone(milestoneId: string, clientId: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contract: { clientId } },
      include: {
        contract: {
          include: {
            freelanceJob: {
              include: { escrowTx: true },
            },
          },
        },
      },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: 'APPROVED', approvedAt: new Date() },
      });

      await tx.eventLog.create({
        data: {
          eventType: 'milestone.approved',
          entityId: milestoneId,
          entityType: 'Milestone',
          payload: {
            milestoneId,
            freelancerId: milestone.contract.freelancerId,
            amount: milestone.amount,
          },
          processedBy: EscrowService.name,
        },
      });
    });

    try {
      // Add to wallet pending balance (3-day hold)
      await this.escrowQueue.add(ESCROW_JOBS.AUTO_RELEASE, {
        milestoneId,
        freelancerId: milestone.contract.freelancerId,
        amount: milestone.amount,
        releaseAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      });
    } catch (err) {
      this.logger.error(
        `Failed to enqueue auto-release for milestone ${milestoneId}`,
        err instanceof Error ? err.stack : err,
      );
    }

    this.logger.log(`Milestone ${milestoneId} approved — payout queued`);
    return { success: true };
  }

  /** Get escrow by ID */
  async getEscrowById(escrowId: string, userId: string) {
    const escrow = await this.prisma.escrowTransaction.findFirst({
      where: {
        id: escrowId,
        freelanceJob: {
          OR: [{ clientId: userId }, { contract: { freelancerId: userId } }],
        },
      },
    });

    if (!escrow) throw new NotFoundException('Escrow not found');
    return escrow;
  }

  /** Get escrow by Gig ID */
  async getEscrowByGig(gigId: string, userId: string) {
    const escrow = await this.prisma.escrowTransaction.findFirst({
      where: {
        freelanceJobId: gigId,
        freelanceJob: {
          OR: [{ clientId: userId }, { contract: { freelancerId: userId } }],
        },
      },
    });

    if (!escrow) return null;
    return escrow;
  }
}
