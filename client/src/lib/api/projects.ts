import { apiClient } from './client';
import { Project } from '../../types';

export const projectsApi = {
  getAll: async () => {
    const response = await apiClient.get('/projects');
    return response.data.data ? response.data.data : response.data;
  },
  
  getOne: async (id: string) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data.data ? response.data.data : response.data;
  },

  getMembers: async (projectId: string) => {
    const response = await apiClient.get(`/projects/${projectId}/members`);
    return response.data.data ? response.data.data : response.data;
  },

  create: async (data: { name: string; description?: string }) => {
    const response = await apiClient.post('/projects', data);
    return response.data.data ? response.data.data : response.data;
  },

  update: async (id: string, data: Partial<Project>) => {
    const response = await apiClient.patch(`/projects/${id}`, data);
    return response.data.data ? response.data.data : response.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data.data ? response.data.data : response.data;
  },

  addMember: async (projectId: string, email: string) => {
    const response = await apiClient.post(`/projects/${projectId}/members`, { email });
    return response.data.data ? response.data.data : response.data;
  },
  
  removeMember: async (projectId: string, userId: string) => {
    const response = await apiClient.delete(`/projects/${projectId}/members/${userId}`);
    return response.data.data ? response.data.data : response.data;
  }
};
