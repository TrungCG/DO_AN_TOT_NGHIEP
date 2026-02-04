import { User } from "./auth";

export interface Comment {
  id: number;
  body: string;
  author: User;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  file: string;
  description: string;
  uploader: User;
  uploaded_at: string;
}

export interface ActivityLog {
  id: number;
  action_description: string;
  actor: User;
  timestamp: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  project: number | null;
  project_name?: string;
  task: number | null;
  task_title?: string;
  is_read: boolean;
  created_at: string;
}
