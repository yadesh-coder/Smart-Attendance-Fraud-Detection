const getBaseUrl = (): string => {
  const env = (import.meta as any).env;
  return (env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
};

const getToken = (): string | null => {
  return localStorage.getItem('smart_attendance_token');
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    let responseData: any = null;

    try {
      responseData = await response.json();
      if (responseData && typeof responseData.message === 'string') {
        errorMessage = responseData.message;
      }
    } catch {
      // Body is not JSON
    }

    switch (response.status) {
      case 400:
        errorMessage = errorMessage || 'Bad Request';
        break;
      case 401:
        errorMessage = errorMessage || 'Unauthorized access';
        break;
      case 403:
        errorMessage = errorMessage || 'Access forbidden';
        break;
      case 404:
        errorMessage = errorMessage || 'Resource not found';
        break;
      case 409:
        errorMessage = errorMessage || 'Resource conflict';
        break;
      case 422:
        errorMessage = errorMessage || 'Unprocessable entity';
        break;
      case 429:
        errorMessage = errorMessage || 'Too many requests';
        break;
      case 500:
        errorMessage = errorMessage || 'Internal server error';
        break;
      case 503:
        errorMessage = errorMessage || 'Service unavailable';
        break;
    }

    throw new ApiError(errorMessage, response.status, responseData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

export const apiClient = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>): Promise<T> =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    }),

  put: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    }),

  patch: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    }),

  delete: <T = any>(endpoint: string, headers?: Record<string, string>): Promise<T> =>
    request<T>(endpoint, { method: 'DELETE', headers }),
};
