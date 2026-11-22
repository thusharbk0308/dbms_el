import axios, { AxiosError } from 'axios';
import type {
  User,
  AuthResponse,
  Category,
  Asset,
  AssetVersion,
  OwnershipHistoryRecord,
  VerificationResponse,
  License,
  Dispute,
  AuditLog,
  BlockchainStatus,
  AnalyticsOverview,
  CategoryDistribution,
  MonthlyTrend,
  CreatorLeaderboardEntry,
  VerificationAccuracy,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every request if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('chainproof_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle 401 unauthorized errors gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token if expired/invalid (unless already on login page)
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('chainproof_token');
        localStorage.removeItem('chainproof_user');
      }
    }
    return Promise.reject(error);
  }
);

// Helper to extract clean error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
    }
    return error.message || 'Network request failed';
  }
  return (error as Error)?.message || 'An unexpected error occurred';
};

// ============================================================================
// Centralized API Services
// ============================================================================

export const api = {
  // Authentication
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      return res.data;
    },
    register: async (userData: { full_name: string; email: string; password: string; role: string }): Promise<User> => {
      const res = await apiClient.post<User>('/auth/register', userData);
      return res.data;
    },
    getProfile: async (): Promise<User> => {
      const res = await apiClient.get<User>('/auth/me');
      return res.data;
    },
  },

  // Categories
  categories: {
    list: async (): Promise<Category[]> => {
      const res = await apiClient.get<Category[]>('/categories');
      return res.data;
    },
  },

  // Assets
  assets: {
    register: async (formData: FormData): Promise<Asset> => {
      const res = await apiClient.post<Asset>('/assets/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    list: async (params?: { creator_id?: number; category_id?: number; visibility?: string; skip?: number; limit?: number }): Promise<Asset[]> => {
      const res = await apiClient.get<Asset[]>('/assets', { params });
      return res.data;
    },
    getById: async (assetId: string): Promise<Asset> => {
      const res = await apiClient.get<Asset>(`/assets/${assetId}`);
      return res.data;
    },
    getVersions: async (assetId: string): Promise<AssetVersion[]> => {
      const res = await apiClient.get<AssetVersion[]>(`/assets/${assetId}/versions`);
      return res.data;
    },
    createVersion: async (assetId: string, formData: FormData): Promise<Asset> => {
      const res = await apiClient.post<Asset>(`/assets/${assetId}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    getHistory: async (assetId: string): Promise<OwnershipHistoryRecord[]> => {
      const res = await apiClient.get<OwnershipHistoryRecord[]>(`/assets/${assetId}/history`);
      return res.data;
    },
    transferClaim: async (assetId: string, payload: { new_creator_id: number; transfer_reason: string; document_reference?: string }): Promise<Asset> => {
      const res = await apiClient.post<Asset>(`/assets/${assetId}/transfer-claim`, payload);
      return res.data;
    },
  },

  // Blockchain
  blockchain: {
    getStatus: async (): Promise<BlockchainStatus> => {
      const res = await apiClient.get<BlockchainStatus>('/blockchain/status');
      return res.data;
    },
    getRecords: async (assetId: string) => {
      const res = await apiClient.get(`/blockchain/records/${assetId}`);
      return res.data;
    },
    verifyVersion: async (versionId: number) => {
      const res = await apiClient.get(`/blockchain/verify/${versionId}`);
      return res.data;
    },
    retry: async (assetId: string, versionNumber: number = 1) => {
      const res = await apiClient.post(`/blockchain/retry/${assetId}?version_number=${versionNumber}`);
      return res.data;
    },
  },

  // Verification
  verification: {
    verifyExact: async (file: File): Promise<VerificationResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<VerificationResponse>('/verification/exact', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    verifyHash: async (submittedHash: string): Promise<VerificationResponse> => {
      const formData = new URLSearchParams();
      formData.append('submitted_hash', submittedHash);
      const res = await apiClient.post<VerificationResponse>('/verification/hash', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return res.data;
    },
    getById: async (verificationId: number): Promise<VerificationResponse> => {
      const res = await apiClient.get<VerificationResponse>(`/verification/${verificationId}`);
      return res.data;
    },
    list: async (params?: { skip?: number; limit?: number }): Promise<VerificationResponse[]> => {
      const res = await apiClient.get<VerificationResponse[]>('/verification', { params });
      return res.data;
    },
  },

  // Licensing
  licenses: {
    create: async (payload: { asset_id: string; licensee_id: number; license_type: string; terms?: string; start_date?: string; expiry_date?: string }): Promise<License> => {
      const res = await apiClient.post<License>('/licenses', payload);
      return res.data;
    },
    list: async (params?: { asset_id?: string; creator_id?: number; licensee_id?: number; status?: string }): Promise<License[]> => {
      const res = await apiClient.get<License[]>('/licenses', { params });
      return res.data;
    },
    getById: async (licenseId: number): Promise<License> => {
      const res = await apiClient.get<License>(`/licenses/${licenseId}`);
      return res.data;
    },
    updateStatus: async (licenseId: number, status: string): Promise<License> => {
      const res = await apiClient.patch<License>(`/licenses/${licenseId}/status`, { status });
      return res.data;
    },
  },

  // Disputes
  disputes: {
    submit: async (formData: FormData): Promise<Dispute> => {
      const res = await apiClient.post<Dispute>('/disputes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    list: async (params?: { asset_id?: string; status?: string }): Promise<Dispute[]> => {
      const res = await apiClient.get<Dispute[]>('/disputes', { params });
      return res.data;
    },
    getById: async (disputeId: number): Promise<Dispute> => {
      const res = await apiClient.get<Dispute>(`/disputes/${disputeId}`);
      return res.data;
    },
    resolve: async (disputeId: number, payload: { dispute_status: string; resolution_notes?: string }): Promise<Dispute> => {
      const res = await apiClient.patch<Dispute>(`/disputes/${disputeId}/resolve`, payload);
      return res.data;
    },
  },

  // Analytics
  analytics: {
    getOverview: async (): Promise<AnalyticsOverview> => {
      const res = await apiClient.get<AnalyticsOverview>('/analytics/overview');
      return res.data;
    },
    getCategories: async (): Promise<CategoryDistribution[]> => {
      const res = await apiClient.get<CategoryDistribution[]>('/analytics/categories');
      return res.data;
    },
    getTrends: async (): Promise<MonthlyTrend[]> => {
      const res = await apiClient.get<MonthlyTrend[]>('/analytics/trends');
      return res.data;
    },
    getCreators: async (): Promise<CreatorLeaderboardEntry[]> => {
      const res = await apiClient.get<CreatorLeaderboardEntry[]>('/analytics/creators');
      return res.data;
    },
    getVerifications: async (): Promise<VerificationAccuracy> => {
      const res = await apiClient.get<VerificationAccuracy>('/analytics/verifications');
      return res.data;
    },
  },

  // Administration
  admin: {
    listUsers: async (params?: { role?: string; status?: string; skip?: number; limit?: number }): Promise<User[]> => {
      const res = await apiClient.get<User[]>('/admin/users', { params });
      return res.data;
    },
    listAssets: async (params?: { status?: string; skip?: number; limit?: number }): Promise<Asset[]> => {
      const res = await apiClient.get<Asset[]>('/admin/assets', { params });
      return res.data;
    },
    listDisputes: async (params?: { status?: string; skip?: number; limit?: number }): Promise<Dispute[]> => {
      const res = await apiClient.get<Dispute[]>('/admin/disputes', { params });
      return res.data;
    },
    listAuditLogs: async (params?: { entity_type?: string; action?: string; user_id?: number; skip?: number; limit?: number }): Promise<AuditLog[]> => {
      const res = await apiClient.get<AuditLog[]>('/admin/audit-logs', { params });
      return res.data;
    },
  },
};
