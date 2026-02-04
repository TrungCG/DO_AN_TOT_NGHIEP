import { User } from './auth';

export type TaskStatus = 'TODO' | 'INPR' | 'DONE';
export type TaskPriority = 'LOW' | 'MED' | 'HIGH';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assignee: User | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: number | null;
  due_date?: string | null;
}
