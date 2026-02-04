import api from '@/lib/api';
import { Project, CreateProjectPayload } from '@/types/project';
import { ActivityLog } from '@/types/extra';

export const projectService = {
  getAll: async () => {
    const response = await api.get<Project[]>('/projects/');
    return response.data;
  },
  create: async (data: CreateProjectPayload) => {
    const response = await api.post<Project>('/projects/', data);
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Project>('/projects/' + id + '/');
    return response.data;
  },
  update: async (id: number, data: Partial<CreateProjectPayload>) => {
    const response = await api.patch<Project>('/projects/' + id + '/', data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete('/projects/' + id + '/');
  },
  addMember: async (projectId: number, userId: number) => {
    const response = await api.post('/projects/' + projectId + '/add_member/', { user_id: userId });
    return response.data;
  },
  removeMember: async (projectId: number, userId: number) => {
    const response = await api.post('/projects/' + projectId + '/remove_member/', { user_id: userId });
    return response.data;
  },
  getActivity: async (projectId: number) => {
    const response = await api.get<ActivityLog[]>('/projects/' + projectId + '/activity/');
    return response.data;
  }
};
