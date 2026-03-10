import { User } from './auth';

export type TaskStatus = 'TODO' | 'INPR' | 'DONE';
export type TaskPriority = 'LOW' | 'MED' | 'HIGH';

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string | null;
  due_date: string | null;
  assignee: User | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_personal?: boolean;
  project?: Project | number | null;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: number | null;
  start_date?: string | null;
  due_date?: string | null;
}
