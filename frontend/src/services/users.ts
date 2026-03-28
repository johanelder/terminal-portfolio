const API = import.meta.env.VITE_API_URL ?? '';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  created_at: string;
}

export async function fetchAllUsers(): Promise<User[]> {
  const res = await fetch(`${API}/api/admin/users`, { credentials: 'include' });
  if (!res.ok) throw new Error('failed to fetch users');
  return res.json();
}

export async function updateUserRole(id: number, role: User['role']): Promise<void> {
  const res = await fetch(`${API}/api/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ role }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'failed to update user');
}

export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`${API}/api/admin/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'failed to delete user');
}
