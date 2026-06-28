/**
 * API client for FYP Relevancy backend.
 * Production: set VITE_API_URL in Vercel env vars (HTTPS URL to EC2/nginx API).
 * Local dev: Frontend/.env → http://localhost:8000/api/v1
 */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Parse FastAPI error `detail` (string, array, or nested object). */
export function parseApiErrorDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const o = item as { msg?: string; loc?: unknown[] };
          const field = Array.isArray(o.loc) ? o.loc[o.loc.length - 1] : 'field';
          let msg = o.msg || 'Invalid value';
          if (msg.startsWith('Value error, ')) msg = msg.slice('Value error, '.length);
          return `${field}: ${msg}`;
        }
        return 'Validation error';
      })
      .join('; ');
  }
  if (detail && typeof detail === 'object' && 'detail' in detail) {
    return parseApiErrorDetail((detail as { detail: unknown }).detail);
  }
  return 'Request failed';
}

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      import.meta.env.VITE_API_URL
        ? 'Cannot reach server. Check that the backend is running and CORS allows this site.'
        : 'Cannot reach server. Set VITE_API_URL in Vercel (production) or Frontend/.env (local dev).',
      0
    );
  }

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiRequest<T>(path, options, false);
    clearTokens();
  }

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    const raw =
      detail && typeof detail === 'object' && 'detail' in detail
        ? (detail as { detail: unknown }).detail
        : detail;
    const parsed = parseApiErrorDetail(raw);
    const message =
      res.status >= 500
        ? `Server error (${res.status}): ${parsed}`
        : parsed;
    throw new ApiError(message, res.status, detail);
  }

  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, formData: FormData) =>
    apiRequest<T>(path, { method: 'POST', body: formData }),
};
