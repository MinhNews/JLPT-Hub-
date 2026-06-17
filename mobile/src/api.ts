export const API_BASE_URL = 'https://jlpt-hub.onrender.com/api';

let authToken = '';

export const setApiToken = (token: string) => {
  authToken = token;
};

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (options.auth !== false && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const endpoints = {
  login: '/auth/login',
  register: '/auth/register',
  me: '/auth/me',
  progress: '/progress',
  progressToggle: '/progress/toggle',
  plans: '/membership/plans',
  subscription: '/membership/status',
  subscribe: '/membership/subscribe',
  transactions: '/membership/transactions',
  notebook: '/notebook',
  adminStats: '/admin/stats',
  adminUsers: '/admin/users',
};
