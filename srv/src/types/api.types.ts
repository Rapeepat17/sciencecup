export interface ApiResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    timestamp: string;
  };
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  tournamentId?: string;
  tournamentRole?: 'owner' | 'admin' | 'scorekeeper' | 'viewer';
}
