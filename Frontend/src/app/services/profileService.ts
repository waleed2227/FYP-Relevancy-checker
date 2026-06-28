import { api } from './api';
import type { AuthUser } from './authService';

export interface ProfileUpdatePayload {
  full_name?: string;
  phone?: string;
  photo_url?: string;
  major?: string;
  year?: string;
  department?: string;
}

export function updateProfile(payload: ProfileUpdatePayload) {
  return api.patch<AuthUser>('/profile', payload);
}
