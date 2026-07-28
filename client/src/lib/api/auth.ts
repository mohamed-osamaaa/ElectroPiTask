import { apiClient } from './client';
import { User } from '../../types';

export const authApi = {
  login: async (credentials: any) => {
    const response = await apiClient.post('/auth/login', credentials);
    // Standard response interceptor mapping?
    // Let's assume NestJS returns { accessToken: string, user: User } directly, wait, we setup standard interceptor:
    // { statusCode: 200, data: { accessToken, user } }
    return response.data.data ? response.data.data : response.data;
  },
  
  register: async (userData: any) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data.data ? response.data.data : response.data;
  },

  getMe: async () => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }
};
