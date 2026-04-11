import { fetchApi } from './api';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export interface UserToken {
  userId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'UNIT_MANAGER';
  unitId?: string;
  iat: number;
  exp: number;
}

export const authService = {
  login: async (email: string, password: string) => {
    const data = await fetchApi<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    Cookies.set('token', data.access_token, { expires: 1 }); // 1 day
    return data;
  },
  
  logout: () => {
    Cookies.remove('token');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  getCurrentUser: (): UserToken | null => {
    const token = Cookies.get('token');
    if (!token) return null;
    try {
      return jwtDecode<UserToken>(token);
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!Cookies.get('token');
  },

  getSetupStatus: async () => {
    return fetchApi<{ setupRequired: boolean }>('/auth/setup-status');
  },

  setupInauguralUser: async (data: any) => {
    return fetchApi('/auth/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
