import { User } from './auth';

export interface Project {
  id: number;
  name: string;
  description: string;
  owner: User;
  members: User[];
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}
