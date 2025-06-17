export interface Case {
    id: string;
    plaintiff: string;
    defendant: string;
    claimType: ClaimType;
    evidence: string;
    requestedDamages: string;
    status: CaseStatus;
    filedAt: string;
    judgment?: Judgment;
    settlement?: Settlement;
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
    APPEALED = 'appealed',
    DISMISSED = 'dismissed'
  }
  
  export interface Judgment {
    verdict: 'guilty' | 'not_guilty';
    awardedDamages: string;
    reasoning: string;
    precedentCitations: string[];
    judgmentDate: string;
  }
  
  export interface Settlement {
    escrowAddress: string;
    requiredAmount: string;
    depositedAmount: string;
    status: 'pending' | 'funded' | 'distributed' | 'expired';
    deadline: string;
  }

  export interface PaymentData {
    from: string;
    amount: string;
    timestamp?: string;
    nonce?: string;
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
  }