// frontend/src/lib/types/index.ts
export interface Case {
  id: string;
  plaintiff: string;
  defendant: string;
  claimType: ClaimType;
  evidence: string;
  requestedDamages: string;
  status: CaseStatus;
  filedAt: string;
  caseWalletAddress?: string;
  judgment?: Judgment;
  judgedAt?: string;
  settlement?: Settlement;
  appealed?: boolean;
  appeal?: Appeal;
  appealDecision?: AppealDecision;
  penalty?: Penalty;
  paymentData?: PaymentData;
}

export enum ClaimType {
  API_FRAUD = 'API_FRAUD',
  DATA_THEFT = 'DATA_THEFT',
  SERVICE_MANIPULATION = 'SERVICE_MANIPULATION',
  TOKEN_FRAUD = 'TOKEN_FRAUD'
}

export enum CaseStatus {
  FILED = 'filed',
  UNDER_REVIEW = 'under_review',
  JUDGED = 'judged',
  SETTLED = 'settled',
  DISMISSED = 'dismissed',
  PENDING_JUDGMENT = 'pending_judgment',
  UNDER_APPEAL = 'under_appeal',
  APPEAL_DENIED = 'appeal_denied',
  APPEAL_GRANTED = 'appeal_granted',
  APPEAL_GRANTED_MODIFIED = 'appeal_granted_modified',
  APPEAL_GRANTED_DISMISSED = 'appeal_granted_dismissed'
}

export interface Judgment {
  verdict: 'guilty' | 'not_guilty' | 'dismissed_frivolous';
  awardedDamages: number | string;
  reasoning: string;
  precedentCitations?: string[];
  judgmentDate?: string;
  evidenceQuality?: 'strong' | 'adequate' | 'weak' | 'frivolous';
  evidenceScore?: number;
  specificFindings?: string[];
  penalty?: number;
  appealModified?: boolean;
  appealDecisionDate?: string;
}

export interface Settlement {
  caseId?: string;
  escrowAddress: string;
  requiredAmount: string;
  depositedAmount?: string;
  status: 'pending_payment' | 'funded' | 'distributed' | 'expired' | 'distribution_failed';
  deadline: string;
  paymentDeadline?: string;
  paymentInstructions?: PaymentInstructions;
  qrCode?: string;
  currentBalance?: string;
  remainingAmount?: string;
  isFullyFunded?: boolean;
  deadlinePassed?: boolean;
  daysRemaining?: number;
  distributions?: Distribution[];
  transactions?: Transaction[];
  distributedAt?: string;
}

export interface PaymentInstructions {
  network: string;
  address: string;
  amount: string;
  memo: string;
}

export interface Distribution {
  recipient: string;
  amount: number;
  reason: string;
}

export interface Transaction {
  to: string;
  amount: number;
  reason: string;
  txHash?: string;
  status: 'completed' | 'failed';
  error?: string;
}

export interface Appeal {
  id: string;
  caseId: string;
  appellant: string;
  reason: string;
  filedAt: string;
  reviewDate: string;
  status: 'pending' | 'under_review' | 'decided';
  paymentData?: PaymentData;
  hoursRemaining?: number;
  readyForReview?: boolean;
}

export interface AppealDecision {
  decision: 'upheld' | 'overturned' | 'modified';
  newVerdict?: 'guilty' | 'not_guilty';
  newAwardedDamages?: number;
  reasoning: string;
  keyFindings?: string[];
  costsAwarded?: 'appellant' | 'respondent' | 'none';
}

export interface Penalty {
  caseId: string;
  penaltyId?: string;
  penaltyType: 'frivolous_lawsuit';
  amount: number;
  payer: string;
  paymentAddress: string;
  status: 'pending_payment' | 'paid' | 'distributed' | 'overdue';
  deadline: string;
  reason: string;
  paymentInstructions?: PaymentInstructions;
  qrCode?: string;
  currentBalance?: number;
  remainingAmount?: number;
  isPaid?: boolean;
  deadlinePassed?: boolean;
  daysRemaining?: number;
  distribution?: {
    courtTreasury: number;
    defendantCompensation: number;
  };
}

export interface PaymentData {
  from: string;
  amount: string;
  timestamp?: string;
  nonce?: string;
  endpoint?: string;
  verified?: boolean;
  requiredAmount?: string;
}

export interface PaymentRequirement {
  amount: string;
  address: string;
  details: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface FileCaseSuccessResponse {
  success: boolean;
  caseId: string;
  message?: string;
  caseWalletAddress?: string;
  nextSteps?: string;
  paymentReceived?: string;
}

export interface JudgmentResponse {
  success: boolean;
  caseId: string;
  judgment: Judgment;
  settlement?: SettlementInfo;
  penalty?: PenaltyInfo;
  message: string;
  paymentReceived?: string;
}

export interface SettlementInfo {
  settlementId: string;
  escrowAddress: string;
  requiredAmount: string;
  paymentInstructions: PaymentInstructions;
  deadline: string;
  qrCode: string;
  message: string;
}

export interface PenaltyInfo {
  amount: number;
  reason: string;
  payableBy: string;
  payableTo: string;
  dueDate: string;
}

export interface AppealResponse {
  success: boolean;
  message: string;
  appealId: string;
  reviewDate: string;
  hoursUntilReview: number;
  nextSteps: string;
  paymentReceived?: string;
}

export interface AppealStatusResponse {
  success: boolean;
  appeal: Appeal;
  appealDecision?: AppealDecision;
  currentStatus: CaseStatus;
}

export interface CaseStats {
  total: number;
  byStatus: Record<string, number>;
  byClaimType: Record<string, number>;
  totalDamagesAwarded: number;
  guiltyVerdicts: number;
  notGuiltyVerdicts: number;
  dismissedFrivolous: number;
  totalPenalties: number;
  appealsGranted: number;
  appealsDenied: number;
}

export interface PendingAppeal {
  caseId: string;
  appealId: string;
  filedAt: string;
  reviewDate: string;
  hoursRemaining: number;
  readyForReview: boolean;
}

// Utility type for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Wallet types
export interface WalletInfo {
  address: string;
  network: string;
  balances: WalletBalance;
  judgment?: Judgment;
  status?: CaseStatus;
}

export interface WalletBalance {
  ETH?: string;
  [key: string]: string | undefined;
  error?: string;
}

// Search and filter types
export interface CaseSearchParams {
  plaintiff?: string;
  defendant?: string;
  claimType?: ClaimType;
  status?: CaseStatus;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export interface CaseListResponse {
  success: boolean;
  cases: Case[];
  count?: number;
  total?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}