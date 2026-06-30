import { api, setTokens, clearTokens } from './api';

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: 'student' | 'professor' | 'admin';
  phone?: string | null;
  photo_url?: string | null;
  student_id?: string | null;
  department?: string | null;
  major?: string | null;
  year?: string | null;
  employee_id?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  role?: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  role: 'student' | 'professor';
  student_id?: string;
  department?: string;
  phone_number?: string;
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const tokens = await api.post<{ access_token: string; refresh_token: string }>(
    '/auth/login',
    payload
  );
  setTokens(tokens.access_token, tokens.refresh_token);
  return fetchMe();
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const tokens = await api.post<{ access_token: string; refresh_token: string }>(
    '/auth/register',
    payload
  );
  setTokens(tokens.access_token, tokens.refresh_token);
  return fetchMe();
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return api.post<{ message: string }>('/auth/forgot-password', { email });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  return api.post<{ message: string }>('/auth/reset-password', {
    token,
    new_password: newPassword,
  });
}

export async function fetchMe(): Promise<AuthUser> {
  return api.get<AuthUser>('/auth/me');
}

export async function logoutApi(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore if token expired
  }
  clearTokens();
}
