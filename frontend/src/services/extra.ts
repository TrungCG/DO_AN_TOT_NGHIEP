import api from "@/lib/api";
import { Comment, Attachment, ActivityLog, Notification } from "@/types/extra";

export const commentService = {
  getAll: async (taskId: number) => {
    const res = await api.get<Comment[]>(`/tasks/${taskId}/comments/`);
    return res.data;
  },
  create: async (taskId: number, body: string) => {
    const res = await api.post<Comment>(`/tasks/${taskId}/comments/`, { body });
    return res.data;
  },
  update: async (taskId: number, commentId: number, body: string) => {
    const res = await api.put<Comment>(
      `/tasks/${taskId}/comments/${commentId}/`,
      { body },
    );
    return res.data;
  },
  delete: async (taskId: number, commentId: number) => {
    await api.delete(`/tasks/${taskId}/comments/${commentId}/`);
  },
};

export const attachmentService = {
  getAll: async (taskId: number) => {
    const res = await api.get<Attachment[]>(`/tasks/${taskId}/attachments/`);
    return res.data;
  },
  upload: async (taskId: number, file: File, description?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (description) formData.append("description", description);
    const res = await api.post<Attachment>(
      `/tasks/${taskId}/attachments/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  },
  delete: async (taskId: number, attachmentId: number) => {
    await api.delete(`/tasks/${taskId}/attachments/${attachmentId}/`);
  },
};

export const activityService = {
  getTaskActivity: async (taskId: number) => {
    const res = await api.get<ActivityLog[]>(`/tasks/${taskId}/activity/`);
    return res.data;
  },
};

export const notificationService = {
  getAll: async () => {
    const res = await api.get<Notification[]>("/notifications/");
    return res.data;
  },
  markAsRead: async (id: number) => {
    await api.post(`/notifications/${id}/read/`, {});
  },
  markAllAsRead: async () => {
    await api.post("/notifications/read-all/", {});
  },
};
