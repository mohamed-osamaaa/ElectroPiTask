import { apiClient } from './client';
import { Project } from '../../types';

export const projectsApi = {
  getAll: async () => {
    const response = await apiClient.get('/projects');
    return response.data.data ? response.data.data : response.data;
  },
  
  getOne: async (id: number) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data.data ? response.data.data : response.data;
  },

  create: async (data: { name: string; description?: string }) => {
    const response = await apiClient.post('/projects', data);
    return response.data.data ? response.data.data : response.data;
  },

  update: async (id: number, data: Partial<Project>) => {
    const response = await apiClient.patch(`/projects/${id}`, data);
    return response.data.data ? response.data.data : response.data;
  },

  remove: async (id: number) => {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data.data ? response.data.data : response.data;
  },

  addMember: async (projectId: number, email: string) => {
    const response = await apiClient.post(`/projects/${projectId}/members`, { email });
    return response.data.data ? response.data.data : response.data;
  },
  
  removeMember: async (projectId: number, userId: number) => {
    const response = await apiClient.delete(`/projects/${projectId}/members/${userId}`);
    return response.data.data ? response.data.data : response.data;
  }
};
