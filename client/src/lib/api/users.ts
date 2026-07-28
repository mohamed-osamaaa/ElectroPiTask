import { apiClient } from './client';
import { User } from '../../types';

export const usersApi = {
  getAll: async (): Promise<Partial<User>[]> => {
    const response = await apiClient.get('/users');
    return response.data.data ? response.data.data : response.data;
  },
};
