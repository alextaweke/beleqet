// lib/notificationHelpers.ts
import { notificationsService } from "../lib/notifications";

export const NotificationHelper = {
  // ── Job Related ──────────────────────────────────────────────────────

  async notifyJobApplied(userId: string, jobTitle: string, jobId: string) {
    await notificationsService.sendNotification({
      userId,
      type: "job.applied",
      title: "Application Submitted",
      body: `You have successfully applied to "${jobTitle}"`,
      metadata: { link: `/jobs/${jobId}` },
    });
  },

  async notifyApplicationStatusChanged(
    userId: string,
    jobTitle: string,
    status: string,
    jobId: string,
  ) {
    await notificationsService.sendNotification({
      userId,
      type: "application.status_changed",
      title: "Application Status Updated",
      body: `Your application for "${jobTitle}" is now ${status.toLowerCase()}`,
      metadata: { link: `/jobs/${jobId}` },
    });
  },

  // ── Bid Related ──────────────────────────────────────────────────────

  async notifyBidPlaced(userId: string, gigTitle: string, gigId: string) {
    await notificationsService.sendNotification({
      userId,
      type: "bid.placed",
      title: "Bid Submitted",
      body: `You have successfully placed a bid on "${gigTitle}"`,
      metadata: { link: `/freelance/${gigId}` },
    });
  },

  async notifyBidAccepted(
    userId: string,
    gigTitle: string,
    contractId: string,
  ) {
    await notificationsService.sendNotification({
      userId,
      type: "bid.accepted",
      title: "🎉 Bid Accepted!",
      body: `Your bid on "${gigTitle}" has been accepted! Check your contract.`,
      metadata: { link: `/contracts/${contractId}` },
      channels: ["IN_APP", "EMAIL", "TELEGRAM"],
    });
  },

  async notifyBidRejected(userId: string, gigTitle: string) {
    await notificationsService.sendNotification({
      userId,
      type: "bid.rejected",
      title: "Bid Not Selected",
      body: `Your bid on "${gigTitle}" was not selected. Keep trying!`,
      metadata: { link: `/freelance` },
    });
  },

  // ── Contract Related ─────────────────────────────────────────────────

  async notifyContractCreated(
    userId: string,
    gigTitle: string,
    contractId: string,
  ) {
    await notificationsService.sendNotification({
      userId,
      type: "contract.created",
      title: "New Contract Started",
      body: `A contract has been created for "${gigTitle}"`,
      metadata: { link: `/contracts/${contractId}` },
      channels: ["IN_APP", "EMAIL"],
    });
  },

  async notifyContractCompleted(
    userId: string,
    gigTitle: string,
    contractId: string,
  ) {
    await notificationsService.sendNotification({
      userId,
      type: "contract.completed",
      title: "🎉 Contract Completed!",
      body: `The contract for "${gigTitle}" has been completed. Great work!`,
      metadata: { link: `/contracts/${contractId}` },
      channels: ["IN_APP", "EMAIL", "TELEGRAM"],
    });
  },

  // ── Milestone Related ────────────────────────────────────────────────

  async notifyMilestoneApproved(
    userId: string,
    milestoneTitle: string,
    contractId: string,
  ) {
    await notificationsService.sendNotification({
      userId,
      type: "milestone.approved",
      title: "⭐ Milestone Approved",
      body: `The milestone "${milestoneTitle}" has been approved. Funds will be released in 3 days.`,
      metadata: { link: `/contracts/${contractId}` },
      channels: ["IN_APP", "EMAIL"],
    });
  },

  // ── Escrow Related ───────────────────────────────────────────────────

  async notifyEscrowFunded(userId: string, gigTitle: string, amount: number) {
    await notificationsService.sendNotification({
      userId,
      type: "escrow.funded",
      title: "💰 Escrow Funded",
      body: `ETB ${amount.toLocaleString()} has been secured for "${gigTitle}"`,
      metadata: { link: `/contracts` },
      channels: ["IN_APP", "EMAIL", "TELEGRAM"],
    });
  },

  async notifyEscrowReleased(userId: string, amount: number) {
    await notificationsService.sendNotification({
      userId,
      type: "escrow.released",
      title: "💸 Payment Released",
      body: `ETB ${amount.toLocaleString()} has been released to your wallet.`,
      metadata: { link: `/freelance/wallet` },
      channels: ["IN_APP", "EMAIL", "TELEGRAM"],
    });
  },

  // ── Message Related ──────────────────────────────────────────────────

  async notifyNewMessage(
    userId: string,
    senderName: string,
    message: string,
    chatRoomId: string,
  ) {
    await notificationsService.sendNotification({
      userId,
      type: "new.message",
      title: `💬 New Message from ${senderName}`,
      body: message.length > 50 ? message.substring(0, 50) + "..." : message,
      metadata: { link: `/chat/${chatRoomId}` },
      channels: ["IN_APP"],
    });
  },

  // ── Dispute Related ──────────────────────────────────────────────────

  async notifyDisputeRaised(
    userId: string,
    contractId: string,
    reason: string,
  ) {
    await notificationsService.sendNotification({
      userId,
      type: "dispute.raised",
      title: "⚠️ Dispute Raised",
      body: `A dispute has been raised on your contract: ${reason}`,
      metadata: { link: `/contracts/${contractId}` },
      channels: ["IN_APP", "EMAIL"],
    });
  },

  async notifyDisputeResolved(userId: string, contractId: string) {
    await notificationsService.sendNotification({
      userId,
      type: "dispute.resolved",
      title: "✅ Dispute Resolved",
      body: `The dispute on your contract has been resolved.`,
      metadata: { link: `/contracts/${contractId}` },
      channels: ["IN_APP", "EMAIL"],
    });
  },

  // ── General ──────────────────────────────────────────────────────────

  async notifyPaymentReceived(userId: string, amount: number) {
    await notificationsService.sendNotification({
      userId,
      type: "payment.received",
      title: "💳 Payment Received",
      body: `ETB ${amount.toLocaleString()} has been added to your wallet.`,
      metadata: { link: `/freelance/wallet` },
      channels: ["IN_APP", "EMAIL", "TELEGRAM"],
    });
  },

  async notifyJobExpiring(userId: string, jobTitle: string, jobId: string) {
    await notificationsService.sendNotification({
      userId,
      type: "job.expiring",
      title: "⏰ Job Expiring Soon",
      body: `Your job "${jobTitle}" will expire in 3 days. Renew it to keep receiving applications.`,
      metadata: { link: `/jobs/${jobId}` },
      channels: ["IN_APP", "EMAIL"],
    });
  },
};
