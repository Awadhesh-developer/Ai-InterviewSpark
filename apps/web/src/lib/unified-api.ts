// Unified API client that communicates directly with backend
// Bypasses Next.js API routes for better performance and consistency

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  phoneNumber?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  phoneNumber?: string;
  bio?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

class UnifiedApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // PERMANENT FIX: Always use correct API server port
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Ensure we don't have double /api in the URL
    const cleanApiUrl = apiUrl.replace(/\/api$/, '');
    this.baseURL = cleanApiUrl;
    
    this.client = axios.create({
      baseURL: `${this.baseURL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🔧 API Client initialized with base URL:', `${this.baseURL}/api`);

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (error.code === 'ECONNREFUSED') {
          toast.error('Cannot connect to server. Please check if the backend is running.');
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      // Also set cookie for SSR compatibility
      document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Lax`;
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
  }

  private handleUnauthorized(): void {
    this.removeToken();
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      
      if (response.data.success && response.data.data) {
        const authData = response.data.data;
        this.setToken(authData.token);
        return authData;
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Login failed';
      throw new Error(message);
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', userData);
      
      if (response.data.success && response.data.data) {
        const authData = response.data.data;
        this.setToken(authData.token);
        return authData;
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Registration failed';
      throw new Error(message);
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.client.get<ApiResponse<User>>('/users/me');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to get current user');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to get current user';
      throw new Error(message);
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint if it exists
      await this.client.post('/auth/logout');
    } catch (error) {
      // Even if backend logout fails, we still want to clear local tokens
      console.warn('Backend logout failed, clearing local tokens anyway');
    } finally {
      this.removeToken();
    }
  }

  // User management methods
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats: {
      total: number;
      active: number;
      pending: number;
      admins: number;
    };
  }> {
    try {
      const response = await this.client.get<{
        success: boolean;
        users: User[];
        pagination: any;
        stats: any;
        error?: string;
      }>('/users', { params });
      
      if (response.data.success) {
        return {
          users: response.data.users,
          pagination: response.data.pagination,
          stats: response.data.stats
        };
      } else {
        throw new Error(response.data.error || 'Failed to get users');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to get users';
      throw new Error(message);
    }
  }

  async createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    department?: string;
    phoneNumber?: string;
    bio?: string;
  }): Promise<User> {
    try {
      // Only send fields that the backend expects for registration
      const registrationData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: userData.role
      };
      
      const response = await this.client.post<ApiResponse<{ user: User }>>('/auth/register', registrationData);
      
      if (response.data.success && response.data.data) {
        return response.data.data.user;
      } else {
        throw new Error(response.data.error || 'Failed to create user');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to create user';
      throw new Error(message);
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const response = await this.client.put<ApiResponse<User>>(`/users/${userId}`, updates);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to update user');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to update user';
      throw new Error(message);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await this.client.delete<ApiResponse>(`/users/${userId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete user');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to delete user';
      throw new Error(message);
    }
  }

  async deleteUsers(userIds: string[]): Promise<{ deletedCount: number; failedCount: number }> {
    try {
      const results = await Promise.allSettled(
        userIds.map(id => this.deleteUser(id))
      );
      
      const deletedCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;
      
      return { deletedCount, failedCount };
    } catch (error: any) {
      throw new Error('Failed to delete users');
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await this.client.put<ApiResponse<User>>('/users/me', data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to update profile';
      throw new Error(message);
    }
  }

  // Health check methods
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      return response.data.success === true;
    } catch (error) {
      return false;
    }
  }

  async checkDatabaseHealth(): Promise<{ healthy: boolean; userCount: number }> {
    try {
      const response = await axios.get(`${this.baseURL}/health/database`, { timeout: 10000 });
      return {
        healthy: response.data.success === true,
        userCount: response.data.tables?.users?.count || 0
      };
    } catch (error) {
      return { healthy: false, userCount: 0 };
    }
  }
}

export const unifiedApiClient = new UnifiedApiClient();
export default unifiedApiClient;
