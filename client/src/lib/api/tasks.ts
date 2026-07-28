import { apiClient } from './client';
import { Task, PaginatedTasks } from '../../types';

export const tasksApi = {
  getAll: async (projectId: string, filters?: any): Promise<PaginatedTasks> => {
    const response = await apiClient.get(`/projects/${projectId}/tasks`, { params: filters });
    return response.data.data ? response.data.data : response.data;
  },
  
  getOne: async (projectId: string, taskId: string) => {
    const response = await apiClient.get(`/projects/${projectId}/tasks/${taskId}`);
    return response.data.data ? response.data.data : response.data;
  },

  create: async (projectId: string, data: Partial<Task>) => {
    const response = await apiClient.post(`/projects/${projectId}/tasks`, data);
    return response.data.data ? response.data.data : response.data;
  },

  update: async (projectId: string, taskId: string, data: Partial<Task>) => {
    const response = await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, data);
    return response.data.data ? response.data.data : response.data;
  },
  
  remove: async (projectId: string, taskId: string) => {
    const response = await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
    return response.data.data ? response.data.data : response.data;
  },

  getHistory: async (projectId: string, taskId: string) => {
    const response = await apiClient.get(`/projects/${projectId}/tasks/${taskId}/history`);
    return response.data.data ? response.data.data : response.data;
  }
};
