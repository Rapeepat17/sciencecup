export const TOKEN_STORAGE_KEY = 'scicup_auth_token_v1';
export const USER_STORAGE_KEY = 'scicup_auth_user_v1';

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any[];

  constructor(statusCode: number, message: string, code: string = 'UNKNOWN_ERROR', details?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {}
  }

  setToken(token: string | null): void {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch {}
  }

  getToken(): string | null {
    if (!this.token) {
      try {
        this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
      } catch {}
    }
    return this.token;
  }

  clearToken(): void {
    this.setToken(null);
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});

    // Attach Content-Type if payload is present and not FormData
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Attach Bearer Token if available
    const token = this.getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Timeout signal (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const mergedOptions: RequestInit = {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    };

    try {
      const response = await fetch(endpoint, mergedOptions);
      clearTimeout(timeoutId);

      // Handle 401 Unauthorized (Expired / Invalid session)
      if (response.status === 401) {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('scicup:auth-expired'));
      }

      const contentType = response.headers.get('content-type') || '';
      let json: any = null;
      if (contentType.includes('application/json')) {
        json = await response.json();
      }

      if (!response.ok) {
        const errorInfo = json?.error || {};
        const errorMessage = errorInfo.message || `Request failed with status ${response.status}`;
        const errorCode = errorInfo.code || `HTTP_${response.status}`;
        throw new ApiError(response.status, errorMessage, errorCode, errorInfo.details);
      }

      // Unwrap standard API response envelope { success: true, data: T }
      if (json && typeof json === 'object' && 'data' in json && json.success === true) {
        return json.data as T;
      }

      return json as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        if (options.signal?.aborted) {
          throw err;
        }
        throw new ApiError(408, 'การเชื่อมต่อหมดเวลา (Request Timeout) กรุณาลองใหม่อีกครั้ง', 'TIMEOUT');
      }
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(500, err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'NETWORK_ERROR');
    }
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
