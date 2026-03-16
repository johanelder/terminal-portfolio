const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface AuthUser {
  id: number;
  username: string;
  role: 'guest' | 'user' | 'admin';
}

export async function apiLogin(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'login failed');
  return data.user as AuthUser;
}

export async function apiRegister(username: string, email: string, password: string): Promise<void> {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'registration failed');
}

export async function apiLogout(): Promise<void> {
  await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function apiMe(): Promise<AuthUser | null> {
  const res = await fetch(`${API}/api/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json();
}
