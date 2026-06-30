// src/lib/api.ts
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach token to EVERY request
api.interceptors.request.use(
  (config) => {
    // IMPORTANT: Use 'accessToken' as the key (matching the guide)
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401/403 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 401: Token expired or invalid
    if (status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // 403: Role doesn't have permission
    if (status === 403) {
      const message = error.response?.data?.detail || "You don't have permission to perform this action";
      console.warn("Permission denied:", message);
      // You can show a toast notification here
    }

    return Promise.reject(error);
  }
);

// Helper functions for auth
export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  
  // Store with correct key names as per the guide
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("user", JSON.stringify(data.user));
  
  return data;
}

export function logout() {
    api.post("/auth/logout")
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function currentUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem("accessToken");
}