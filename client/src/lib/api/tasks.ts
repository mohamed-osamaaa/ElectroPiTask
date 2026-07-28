import { apiClient } from './client';
import { Task, PaginatedTasks } from '../../types';

export const tasksApi = {
  getAll: async (projectId: number, filters?: any): Promise<PaginatedTasks> => {
    const response = await apiClient.get(`/projects/${projectId}/tasks`, { params: filters });
    return response.data.data ? response.data.data : response.data;
  },
  
  getOne: async (projectId: number, taskId: number) => {
    const response = await apiClient.get(`/projects/${projectId}/tasks/${taskId}`);
    return response.data.data ? response.data.data : response.data;
  },

  create: async (projectId: number, data: Partial<Task>) => {
    const response = await apiClient.post(`/projects/${projectId}/tasks`, data);
    return response.data.data ? response.data.data : response.data;
  },

  update: async (projectId: number, taskId: number, data: Partial<Task>) => {
    const response = await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, data);
    return response.data.data ? response.data.data : response.data;
  },
  
  remove: async (projectId: number, taskId: number) => {
    const response = await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
    return response.data.data ? response.data.data : response.data;
  },

  getHistory: async (projectId: number, taskId: number) => {
    const response = await apiClient.get(`/projects/${projectId}/tasks/${taskId}/history`);
    return response.data.data ? response.data.data : response.data;
  }
};
