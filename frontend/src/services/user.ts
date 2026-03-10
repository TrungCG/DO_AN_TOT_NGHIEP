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
  }
};
