// ============================================================================
// ChainProof - TypeScript Type Definitions
// Exactly matching backend Pydantic schemas and database models
// ============================================================================

export type UserRole = 'CREATOR' | 'VERIFIER' | 'ADMINISTRATOR';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type AssetVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';
export type LicenseType = 'Personal' | 'Educational' | 'Commercial' | 'Custom';
export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';
export type DisputeStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
export type VerificationResult = 'EXACT_MATCH' | 'NOT_REGISTERED' | 'BLOCKCHAIN_VERIFICATION_FAILED';

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  role: UserRole;
  email: string;
  full_name?: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  description?: string;
  created_at?: string;
}

export interface BlockchainRecord {
  record_id?: number;
  transaction_hash: string;
  block_number: number;
  network_name: string;
  contract_address: string;
  blockchain_timestamp: string;
  transaction_status: TransactionStatus;
}

export interface AssetVersion {
  version_id: number;
  asset_id: string;
  version_number: number;
  file_hash: string;
  file_path?: string;
  file_size: number;
  changelog?: string;
  created_at: string;
  blockchain_record?: BlockchainRecord;
}

export interface OwnershipHistoryRecord {
  history_id: number;
  asset_id: string;
  previous_claimant_id?: number;
  new_claimant_id: number;
  transfer_timestamp: string;
  transfer_reason: string;
  document_reference?: string;
}

export interface Asset {
  asset_id: string;
  creator_id: number;
  category_id: number;
  title: string;
  description?: string;
  original_filename: string;
  stored_filename?: string;
  file_size: number;
  mime_type: string;
  visibility: AssetVisibility;
  registration_status: RegistrationStatus;
  created_at: string;
  registered_at?: string;
  creator_name?: string;
  category_name?: string;
  current_version?: AssetVersion;
  versions?: AssetVersion[];
  blockchain_records?: BlockchainRecord[];
}

export interface VerificationResponse {
  verification_id: number;
  submitted_filename?: string;
  submitted_hash: string;
  verification_result: VerificationResult;
  is_match: boolean;
  matched_asset?: {
    asset_id: string;
    title: string;
    creator_name?: string;
    category_name?: string;
    registered_at?: string;
  };
  matched_version?: {
    version_id: number;
    version_number: number;
    file_hash: string;
    created_at: string;
  };
  blockchain_verification?: {
    verified: boolean;
    transaction_hash?: string;
    block_number?: number;
    blockchain_timestamp?: string;
    registrant?: string;
    network?: string;
  };
  competing_claim_count: number;
  competing_claims?: Array<{
    asset_id: string;
    title: string;
    creator_name: string;
    registered_at: string;
  }>;
  verified_at: string;
  legal_disclaimer: string;
}

export interface License {
  license_id: number;
  asset_id: string;
  creator_id: number;
  licensee_id: number;
  license_type: LicenseType;
  terms?: string;
  start_date: string;
  expiry_date?: string;
  status: LicenseStatus;
  created_at: string;
  asset_title?: string;
  creator_name?: string;
  licensee_name?: string;
}

export interface Dispute {
  dispute_id: number;
  asset_id: string;
  reporter_id: number;
  description: string;
  evidence_path?: string;
  dispute_status: DisputeStatus;
  resolution_notes?: string;
  resolved_by?: number;
  created_at: string;
  resolved_at?: string;
  asset_title?: string;
  reporter_name?: string;
}

export interface AuditLog {
  log_id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string;
  created_at: string;
}

export interface BlockchainStatus {
  connected: boolean;
  rpc_url: string;
  network_name: string;
  chain_id: number;
  contract_address: string;
  current_block_number: number;
}

export interface AnalyticsOverview {
  total_assets: number;
  total_confirmed_assets: number;
  total_pending_assets: number;
  total_creators: number;
  total_licenses_issued: number;
  total_active_licenses: number;
  total_disputes: number;
  open_disputes: number;
  total_verifications: number;
  exact_match_verifications: number;
}

export interface CategoryDistribution {
  category_id: number;
  category_name: string;
  asset_count: number;
  total_bytes: number;
}

export interface MonthlyTrend {
  month: string;
  total_registrations: number;
  confirmed_registrations: number;
}

export interface CreatorLeaderboardEntry {
  creator_id: number;
  full_name: string;
  email: string;
  asset_count: number;
  licenses_issued: number;
}

export interface VerificationAccuracy {
  total_verifications: number;
  exact_match_count: number;
  mismatch_count: number;
  not_registered_count: number;
  match_rate_percentage: number;
}
