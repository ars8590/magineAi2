import axios from 'axios';
import { AdminModeration, FeedbackPayload, GenerationRequest, GeneratedContent } from '../types';

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || '/backend'
});
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        // Clear tokens content on 401 to force re-login/re-exchange
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('admin_token');

        // Optional: Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export async function generateContent(payload: GenerationRequest) {
  const { data } = await api.post<{ id: string }>('/generate', payload);
  return data;
}

export async function fetchContent(id: string) {
  const { data } = await api.get<GeneratedContent>(`/content/${id}`);
  return data;
}

export async function submitFeedback(payload: FeedbackPayload) {
  const { data } = await api.post('/feedback', payload);
  return data;
}

export async function fetchAdminFeedback() {
  const { data } = await api.get('/feedback/admin');
  return data;
}

export async function fetchFeedbackStats() {
  const { data } = await api.get('/feedback/admin/stats');
  return data;
}

export async function adminLogin(username: string, password: string) {
  const { data } = await api.post<{ token: string }>('/auth/login', { username, password });
  return data;
}

export async function userLogin(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: { id: string; name: string; email: string } }>(
    '/auth/login/user',
    { email, password }
  );
  return data;
}

export async function userSignup(name: string, email: string, password: string) {
  const { data } = await api.post<{ token: string; user: { id: string; name: string; email: string } }>(
    '/auth/signup',
    { name, email, password }
  );
  return data;
}



export async function getLibrary() {
  const { data } = await api.get<GeneratedContent[]>('/library');
  return data;
}

export async function deleteContent(id: string) {
  // Soft delete by default via DELETE /:id which we mapped to soft delete on backend
  await api.delete(`/library/${id}`);
}

export async function moveToTrash(id: string) {
  await api.post(`/library/${id}/trash`);
}

export async function restoreContent(id: string) {
  await api.post(`/library/${id}/restore`);
}

export async function permanentDeleteContent(id: string) {
  await api.delete(`/library/${id}/permanent`);
}

export async function emptyTrash() {
  await api.delete(`/library/trash/empty`);
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  await api.post(`/library/${id}/favorite`, { is_favorite: isFavorite });
}

export async function fetchUsers() {
  const { data } = await api.get<{ id: string, name: string, email: string, created_at: string, status: string }[]>('/admin/users');
  return data;
}

export async function updateUserStatus(userId: string, status: 'active' | 'blocked') {
  await api.post(`/admin/users/${userId}/status`, { status });
}



export async function fetchAdminAnalytics() {
  const { data } = await api.get('/admin/analytics');
  return data;
}


export async function authExchange(supabaseToken: string) {
  const { data } = await api.post<{ token: string; user: { id: string; name: string; email: string } }>(
    '/auth/exchange',
    { supabaseToken }
  );
  return data;
}

export async function saveUserPreferences(data: any) {
  await api.post('/preferences', data);
}

export async function fetchUserPreferences() {
  const { data } = await api.get('/preferences');
  return data;
}
