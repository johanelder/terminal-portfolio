const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface Post {
  id: number;
  title: string;
  description: string | null;
  external_url: string | null;
  tags: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at?: string;
}

export type PostInput = {
  title: string;
  description?: string;
  external_url?: string;
  tags?: string;
  status: 'draft' | 'published';
};

export async function fetchPublishedPosts(): Promise<Post[]> {
  const res = await fetch(`${API}/api/posts`, { credentials: 'include' });
  if (!res.ok) throw new Error('failed to fetch posts');
  return res.json();
}

export async function fetchAllPosts(): Promise<Post[]> {
  const res = await fetch(`${API}/api/admin/posts`, { credentials: 'include' });
  if (!res.ok) throw new Error('failed to fetch posts');
  return res.json();
}

export async function createPost(data: PostInput): Promise<{ id: number }> {
  const res = await fetch(`${API}/api/admin/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'failed to create post');
  return json;
}

export async function updatePost(id: number, data: Partial<PostInput>): Promise<void> {
  const res = await fetch(`${API}/api/admin/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'failed to update post');
}

export async function deletePost(id: number): Promise<void> {
  const res = await fetch(`${API}/api/admin/posts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'failed to delete post');
}
