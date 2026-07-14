// types/freelance.ts

export interface FreelanceJob {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  pricingType: string;
  deadlineDays: number;
  skills: string[];
  status: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: string[];
  experienceLevel: string | null;
  locationPreference: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category: {
    id: string;
    label: string;
    slug: string;
  };
  bids: Bid[];
  contract?: {
    id: string;
    status: string;
  };
  _count: {
    bids: number;
  };
}

export interface Bid {
  id: string;
  amount: number;
  timelineDays: number;
  coverLetter: string;
  status: string;
  qualityScore: number | null;
  createdAt: string;
  updatedAt: string;
  freelanceJob: {
    id: string;
    title: string;
    category: {
      id: string;
      label: string;
      slug: string;
    };
    client: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Contract {
  id: string;
  freelanceJobId: string;
  clientId: string;
  freelancerId: string;
  agreedAmount: number;
  currency: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  chatRoomId?: string;
  freelanceJob: {
    id: string;
    title: string;
    description: string;
    category: {
      id: string;
      label: string;
      slug: string;
    };
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  milestones: Milestone[];
  dispute: Dispute | null;
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  deadline: string;
  status: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deliverables: Deliverable[];
}

export interface Deliverable {
  id: string;
  fileUrl: string | null;
  notes: string | null;
  submittedAt: string;
}

export interface Dispute {
  id: string;
  contractId: string;
  reason: string;
  evidenceUrls: string[];
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletData {
  id: string;
  userId: string;
  pendingBalance: number;
  availableBalance: number;
  currency: string;
  updatedAt: string;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type:
    | "CREDIT_PENDING"
    | "CREDIT_AVAILABLE"
    | "DEBIT_WITHDRAWAL"
    | "DEBIT_FEE";
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface CreateFreelanceJobDto {
  title: string;
  description: string;
  categoryId: string;
  budgetMin: number;
  budgetMax: number;
  pricingType?: string;
  deadlineDays: number;
  skills: string[];
  locationPreference?: string;
  experienceLevel?: string;
  attachments?: string[];
}

export interface CreateBidDto {
  amount: number;
  timelineDays: number;
  coverLetter: string;
}

export interface FreelanceCategory {
  id: string;
  label: string;
  slug: string;
  icon: string | null;
}
