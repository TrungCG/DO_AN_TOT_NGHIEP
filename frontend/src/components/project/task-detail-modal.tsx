"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Paperclip,
  Trash2,
  Activity,
  FileText,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Task } from "@/types/task";
import { User } from "@/types/auth";
import { Comment, Attachment, ActivityLog } from "@/types/extra";
import {
  commentService,
  attachmentService,
  activityService,
} from "@/services/extra";
import { taskService } from "@/services/task";
import { cn } from "@/lib/utils";

interface TaskDetailModalProps {
  task: Task;
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
  members: User[];
}

export function TaskDetailModal({
  task,
  projectId: _projectId, // Kept for future use (e.g., navigation to project)
  open,
  onOpenChange,
  onUpdate,
  members,
}: TaskDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit States
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // Comment Edit States
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [c, a, act] = await Promise.all([
        commentService.getAll(task.id),
        attachmentService.getAll(task.id),
        activityService.getTaskActivity(task.id),
      ]);
      setComments(c);
      setAttachments(a);
      setActivities(act);
    } catch (error) {
      console.error(error);
    }
  }, [task.id]);

  useEffect(() => {
    if (open) {
      fetchData();
      setTitle(task.title);
      setDescription(task.description || "");
    }
  }, [open, task.id, fetchData, task.title, task.description]);

  const handleUpdateTask = async (data: Record<string, unknown>) => {
    try {
      await taskService.update(task.id, data);
      toast.success("Đã cập nhật công việc");
      if (onUpdate) onUpdate();
    } catch {
      toast.error("Lỗi cập nhật công việc");
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      await commentService.create(task.id, newComment);
      setNewComment("");
      fetchData();
      toast.success("Đã gửi bình luận");
    } catch {
      toast.error("Lỗi gửi bình luận");
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentBody(comment.body);
  };

  const handleUpdateComment = async () => {
    if (!editingCommentBody.trim() || editingCommentId === null) return;
    try {
      await commentService.update(
        task.id,
        editingCommentId,
        editingCommentBody,
      );
      setEditingCommentId(null);
      setEditingCommentBody("");
      fetchData();
      toast.success("Đã cập nhật bình luận");
    } catch {
      toast.error("Lỗi cập nhật bình luận");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentBody("");
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      await commentService.delete(task.id, commentId);
      fetchData();
      toast.success("Đã xóa bình luận");
    } catch {
      toast.error("Lỗi xóa bình luận");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await attachmentService.upload(task.id, file);
      fetchData();
      toast.success("Đã tải lên tệp");
    } catch {
      toast.error("Lỗi tải lên tệp");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm("Bạn có chắc muốn xóa tệp này?")) return;
    try {
      await attachmentService.delete(task.id, attachmentId);
      fetchData();
      toast.success("Đã xóa tệp");
    } catch {
      toast.error("Lỗi xóa tệp");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b">
          <div className="flex justify-between items-start">
            <div className="w-full mr-8">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title !== task.title) handleUpdateTask({ title });
                }}
                className="text-xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0"
              />
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{task.status}</Badge>
                <span className="text-sm text-gray-500">
                  trong danh sách{" "}
                  <strong>
                    {task.status === "TODO"
                      ? "To Do"
                      : task.status === "INPR"
                        ? "In Progress"
                        : "Done"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content (Left) */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8">
              {/* Description */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" /> Mô tả
                </h3>
                {isEditingDesc ? (
                  <div className="space-y-2">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-25"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          handleUpdateTask({ description });
                          setIsEditingDesc(false);
                        }}
                      >
                        Lưu
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingDesc(false)}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="bg-gray-50 p-4 rounded-md text-sm min-h-25 cursor-pointer hover:bg-gray-100"
                    onClick={() => setIsEditingDesc(true)}
                  >
                    {description || "Chưa có mô tả chi tiết... (Nhấn để sửa)"}
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Paperclip className="w-4 h-4" /> Tệp đính kèm
                </h3>
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center font-bold text-gray-500">
                          FILE
                        </div>
                        <div className="truncate">
                          <a
                            href={att.file}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium hover:underline truncate block"
                          >
                            {att.file.split("/").pop()}
                          </a>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(att.uploaded_at), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAttachment(att.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <div className="mt-2">
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? "Đang tải..." : "Thêm tệp"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Activity */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" /> Hoạt động
                </h3>
                <div className="space-y-4">
                  {/* Comment Input */}
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Viết bình luận..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Button size="sm" onClick={handleSendComment}>
                        Lưu
                      </Button>
                    </div>
                  </div>

                  {/* Activity List */}
                  <div className="space-y-4 mt-4">
                    {(() => {
                      const activityItems = [
                        ...comments.map((c) => ({
                          type: "comment" as const,
                          data: c,
                          date: c.created_at,
                        })),
                        ...activities.map((a) => ({
                          type: "log" as const,
                          data: a,
                          date: a.timestamp,
                        })),
                      ];

                      return activityItems
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime(),
                        )
                        .map((item, idx) => (
                          <div key={idx} className="flex gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {item.type === "comment"
                                  ? item.data.author?.username?.[0]
                                  : item.data.actor?.username?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm">
                                <span className="font-semibold">
                                  {item.type === "comment"
                                    ? item.data.author?.username
                                    : item.data.actor?.username}
                                </span>
                                <span className="text-gray-500 ml-2 text-xs">
                                  {formatDistanceToNow(new Date(item.date), {
                                    addSuffix: true,
                                    locale: vi,
                                  })}
                                </span>
                              </div>
                              {item.type === "comment" ? (
                                editingCommentId === item.data.id ? (
                                  <div className="mt-1 space-y-2">
                                    <Textarea
                                      value={editingCommentBody}
                                      onChange={(e) =>
                                        setEditingCommentBody(e.target.value)
                                      }
                                      className="text-sm min-h-[80px]"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={handleUpdateComment}
                                      >
                                        Lưu
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                      >
                                        Hủy
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 text-sm bg-white border p-2 rounded mt-1 shadow-sm">
                                      {item.data.body}
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs"
                                        onClick={() =>
                                          handleEditComment(item.data)
                                        }
                                      >
                                        Sửa
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                        onClick={() =>
                                          handleDeleteComment(item.data.id)
                                        }
                                      >
                                        Xóa
                                      </Button>
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="text-sm text-gray-600 italic">
                                  {item.data.action_description}
                                </div>
                              )}
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Sidebar (Right) */}
          <div className="w-64 bg-gray-50 border-l p-4 space-y-6">
            {/* Assignee */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Thành viên
              </h4>
              <Select
                value={task.assignee?.id.toString() || "unassigned"}
                onValueChange={(val) =>
                  handleUpdateTask({
                    assignee_id: val === "unassigned" ? null : parseInt(val),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thành viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Chưa giao</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Độ ưu tiên
              </h4>
              <Select
                value={task.priority}
                onValueChange={(val) => handleUpdateTask({ priority: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Thấp</SelectItem>
                  <SelectItem value="MED">Trung bình</SelectItem>
                  <SelectItem value="HIGH">Cao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Hạn chót
              </h4>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !task.due_date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {task.due_date ? (
                      format(new Date(task.due_date), "PPP", { locale: vi })
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      task.due_date ? new Date(task.due_date) : undefined
                    }
                    onSelect={(date) =>
                      handleUpdateTask({
                        due_date: date ? date.toISOString() : null,
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Xóa công việc
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
