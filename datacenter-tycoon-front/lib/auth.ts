import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:33000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth-token');
      Cookies.remove('user-data');
      window.location.href = '/welcome';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      Cookies.set('auth-token', access_token, { expires: 7, secure: true, sameSite: 'strict' });
      Cookies.set('user-data', JSON.stringify(user), { expires: 7, secure: true, sameSite: 'strict' });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Login failed');
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async register(data: RegisterData): Promise<User> {
    try {
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Registration failed');
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('auth-token');
      Cookies.remove('user-data');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to send reset email');
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      await api.post('/auth/reset-password', { token, password });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to reset password');
      }
      throw new Error('An unexpected error occurred');
    }
  }

  getCurrentUser(): User | null {
    try {
      const userData = Cookies.get('user-data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return Cookies.get('auth-token') || null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async refreshToken(): Promise<string> {
    try {
      const response = await api.post('/auth/refresh');
      const { access_token } = response.data;
      
      Cookies.set('auth-token', access_token, { expires: 7, secure: true, sameSite: 'strict' });
      
      return access_token;
    } catch (error) {
      this.logout();
      throw new Error('Session expired');
    }
  }
}

export const authService = new AuthService();
export { api };