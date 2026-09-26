export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // Not JSON
      }
      throw new APIError(response.status, errorMessage);
    }

    // Attempt to parse JSON; some endpoints might return empty body or 204
    const text = await response.text();
    return text ? JSON.parse(text) : (null as any);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // Network errors
    throw new Error(error instanceof Error ? error.message : 'Network failure');
  }
}

// ============================================================================
// Types
// ============================================================================

export interface ComplaintCreatePayload {
  guest_id: number;
  room_number: number;
  text: string;
  language: string;
}

export interface ClassificationInfo {
  issue_type: string;
  department: string;
  priority: string;
  location: string | null;
  required_skill: string;
  confidence: number;
  source: string;
  reasoning: string;
}

export interface AssignmentInfo {
  assignment_id: number | null;
  staff_id: number | null;
  staff_name: string | null;
  score: number | null;
  score_breakdown: any | null;
  reasoning: string | null;
}

export interface ComplaintResponse {
  id: number;
  guest_id: number;
  room_number: number;
  text: string;
  language: string;
  status: string;
  created_at: string;
  // Enriched fields for POST
  task_id?: number | null;
  task_status?: string | null;
  classification?: ClassificationInfo | null;
  assignment?: AssignmentInfo | null;
}

export interface CompletionProofResponse {
  id: number;
  photo_path: string;
  verified: boolean;
  verified_at: string | null;
}

export interface TaskStatusHistoryResponse {
  id: number;
  old_status: string;
  new_status: string;
  timestamp: string;
}

export interface TaskResponse {
  id: number;
  complaint_id: number;
  issue_type: string | null;
  department: string | null;
  priority: string | null;
  location: string | null;
  required_skill_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  assignments?: AssignmentInfo[];
  completion_proofs?: CompletionProofResponse[];
  status_history?: TaskStatusHistoryResponse[];
}

// ── Day 3: Staff, Stats, Rooms ───────────────────────────────────────────────

export interface StaffMemberResponse {
  id: number;
  name: string;
  department: string;
  available: boolean;
  shift_start: string | null;
  shift_end: string | null;
  active_task_count: number;
  skills: string[];
}

export interface ResortStatsResponse {
  tasks: {
    total: number;
    created: number;
    assigned: number;
    in_progress: number;
    completed: number;
    verified: number;
    closed: number;
    active: number;
  };
  complaints: {
    total: number;
    open: number;
    high_priority: number;
  };
  assignments: {
    assigned: number;
    unassigned: number;
  };
}

export interface RoomResponse {
  id: number;
  room_number: number;
  room_type: string;
  floor: number | null;
  status: string; // occupied | available | cleaning | maintenance
}

export interface RecommendationResponse {
  action: string;
  reason: string;
  priority: string;
  evidence: string[];
  source: string;
}

export interface CompetitorResponse {
  name: string;
  rate: number;
}

export interface PricingAnalysisResponse {
  property_name: string;
  room_type: string;
  your_rate: number;
  competitors: CompetitorResponse[];
  market_average: number;
  market_min: number;
  market_max: number;
  recommendation: string;
  recommended_rate_min: number;
  recommended_rate_max: number;
  reason: string;
  evidence: string[];
  source: string;
  data_status: string;
}

export interface MatchedRoom {
  room_number: number;
  room_type: string;
  base_rate: number;
  status: string;
  floor: number | null;
  match_score: number;
  match_reason: string;
  explanation: string;
}

export interface ParsedRequirements {
  room_type: string | null;
  max_price: number | null;
  min_price: number | null;
  unsupported_requirements: string[];
}

export interface RoomMatchResponse {
  query: string;
  parsed_requirements: ParsedRequirements;
  matches: MatchedRoom[];
  source: string;
  data_status: string;
  warning: string | null;
}

export interface AuditLogResponse {
  id: number;
  action: string;
  user_id: number | null;
  resource_type: string;
  resource_id: number;
  details_json: any | null;
  created_at: string;
}

// ============================================================================
// API Methods
// ============================================================================

export const api = {
  getHealth: () => fetchAPI('/health'),
  
  createComplaint: (payload: ComplaintCreatePayload): Promise<ComplaintResponse> => 
    fetchAPI<ComplaintResponse>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    
  getComplaints: (): Promise<ComplaintResponse[]> => 
    fetchAPI<ComplaintResponse[]>('/api/complaints'),
    
  getComplaint: (id: number): Promise<ComplaintResponse> => 
    fetchAPI<ComplaintResponse>(`/api/complaints/${id}`),
    
  getTasks: (): Promise<TaskResponse[]> => 
    fetchAPI<TaskResponse[]>('/api/tasks'),
    
  getTask: (id: number): Promise<TaskResponse> => 
    fetchAPI<TaskResponse>(`/api/tasks/${id}`),
    
  updateTaskStatus: (id: number, status: string): Promise<TaskResponse> => 
    fetchAPI<TaskResponse>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    
  uploadCompletionProof: async (id: number, file: File): Promise<TaskResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // We cannot use fetchAPI directly because we shouldn't set Content-Type: application/json
    const url = `${API_BASE_URL}/api/tasks/${id}/completion-proof`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      let errorMessage = 'Upload failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {}
      throw new APIError(response.status, errorMessage);
    }
    
    return response.json();
  },

  // ── Day 3: Resort 360 endpoints ──────────────────────────────────────────
  getStaff: (): Promise<StaffMemberResponse[]> =>
    fetchAPI<StaffMemberResponse[]>('/api/staff'),

  getStats: (): Promise<ResortStatsResponse> =>
    fetchAPI<ResortStatsResponse>('/api/stats'),

  getRooms: (): Promise<RoomResponse[]> =>
    fetchAPI<RoomResponse[]>('/api/rooms'),

  getNextAction: (): Promise<RecommendationResponse> =>
    fetchAPI<RecommendationResponse>('/api/intelligence/next-action'),
    
  getSystemicIssues: (): Promise<SystemicIssueResponse> =>
    fetchAPI<SystemicIssueResponse>('/api/intelligence/systemic-issues'),
    
  getPricingAnalysis: (roomType: string = "AC Deluxe"): Promise<PricingAnalysisResponse> =>
    fetchAPI<PricingAnalysisResponse>(`/api/pricing/competitive-analysis?room_type=${encodeURIComponent(roomType)}`),

  getRoomRecommendation: (query: string): Promise<RoomMatchResponse> =>
    fetchAPI<RoomMatchResponse>('/api/recommendations/room-match', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  getAuditLogs: (limit: number = 50): Promise<AuditLogResponse[]> =>
    fetchAPI<AuditLogResponse[]>(`/api/audit?limit=${limit}`),

  downloadOperationsReport: async (): Promise<void> => {
    const url = `${API_BASE_URL}/api/reports/operations`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to download report');
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'smart-resort-operations-report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  analyzeCancellationRisk: async (payload: any): Promise<any> => {
    return fetchAPI<any>('/api/ml/cancellation-risk', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
};

export interface SystemicIssue {
  type: string;
  title: string;
  severity: string;
  summary: string;
  evidence: string[];
  source: string;
}

export interface SystemicIssueResponse {
  issues: SystemicIssue[];
}
