import api from '@/lib/api';
import { User } from '@/types/auth';

export const userService = {
  search: async (query: string) => {
    const response = await api.get<User[]>('/users/?search=' + query);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get<User>('/users/me/');
    return response.data;
  },

  getAll: async () => {
    const response = await api.get<User[]>('/users/');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<User>(`/users/${id}/`);
    return response.data;
  },

  // Admin endpoints
  adminGetAll: async () => {
    const response = await api.get<User[]>('/admin/users/');
    return response.data;
  },

  adminGetById: async (id: number) => {
    const response = await api.get<User>(`/admin/users/${id}/`);
    return response.data;
  },

  adminUpdateUser: async (id: number, data: Partial<User>) => {
    const response = await api.patch<User>(`/admin/users/${id}/`, data);
    return response.data;
  },

  adminDeleteUser: async (id: number) => {
    const response = await api.delete(`/admin/users/${id}/`);
    return response.data;
  }
};
