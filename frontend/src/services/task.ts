import api from '@/lib/api';
import { Task, CreateTaskPayload } from '@/types/task';

export const taskService = {
  getByProject: async (projectId: number) => {
    const response = await api.get<Task[]>('/projects/' + projectId + '/tasks/');
    return response.data;
  },
  create: async (projectId: number, data: CreateTaskPayload) => {
    const response = await api.post<Task>('/projects/' + projectId + '/tasks/', data);
    return response.data;
  },
  update: async (taskId: number, data: Partial<CreateTaskPayload>) => {
    const response = await api.patch<Task>('/tasks/' + taskId + '/', data);
    return response.data;
  },
  delete: async (taskId: number) => {
    await api.delete('/tasks/' + taskId + '/');
  },
  // Personal Tasks
  getPersonal: async () => {
    const response = await api.get<Task[]>('/my-tasks/');
    return response.data;
  },
  createPersonal: async (data: CreateTaskPayload) => {
    const response = await api.post<Task>('/my-tasks/', data);
    return response.data;
  }
};
