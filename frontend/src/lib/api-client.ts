import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  timeout: 10_000,
});

// Attach stored token on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('gramtrust_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('gramtrust_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export async function fetcher<T>(url: string) {
  const { data } = await apiClient.get<{ data: T }>(url);
  return data.data;
}

export async function mutator<T>(url: string) {
  const { data } = await apiClient.post<{ data: T }>(url);
  return data.data;
}