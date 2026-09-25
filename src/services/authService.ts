import { UserAccount } from '../types/ide';
import { api, getToken, setToken } from './apiClient';

const SESSION_STORAGE_KEY = 'browser_studio_session_v2';

export function getCurrentSession(): UserAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentSession(user: UserAccount | null): void {
  try {
    if (user) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch { /* ignore */ }
}

export async function restoreSession(): Promise<UserAccount | null> {
  if (!getToken()) {
    setCurrentSession(null);
    return null;
  }
  try {
    const data = await api<{ user: UserAccount }>('/api/auth/me');
    setCurrentSession(data.user);
    return data.user;
  } catch {
    setToken(null);
    setCurrentSession(null);
    return null;
  }
}

export async function requestOtp(email: string, purpose: 'signup' | 'recovery') {
  return api<{ sent: boolean; expiresIn: number; devCode?: string }>('/api/auth/otp', {
    method: 'POST',
    bodyObj: { email, purpose },
  });
}

export async function verifyOtp(email: string, code: string, purpose: 'signup' | 'recovery') {
  return api<{ verified: boolean }>('/api/auth/otp/verify', {
    method: 'POST',
    bodyObj: { email, code, purpose },
  });
}

export async function registerUser(email: string, username: string, displayName: string, password: string) {
  const data = await api<{ user: UserAccount; requiresLogin: boolean }>('/api/auth/register', {
    method: 'POST',
    bodyObj: { email, username, displayName, password },
  });
  return { success: true as const, user: data.user, requiresLogin: true };
}

export async function loginUser(identifier: string, password: string) {
  const data = await api<{ user: UserAccount; token: string }>('/api/auth/login', {
    method: 'POST',
    bodyObj: { usernameOrEmail: identifier, password },
  });
  setToken(data.token);
  setCurrentSession(data.user);
  return { success: true as const, user: data.user };
}

export async function recoverPassword(email: string, password: string) {
  return api('/api/auth/recovery', { method: 'POST', bodyObj: { email, password } });
}

export async function logoutUser(): Promise<void> {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  setToken(null);
  setCurrentSession(null);
}

export function getStoredCollaborators() { return []; }
export function saveCollaborators(_members: unknown) { /* not live */ }
export function getStoredUsers(): UserAccount[] { return []; }
