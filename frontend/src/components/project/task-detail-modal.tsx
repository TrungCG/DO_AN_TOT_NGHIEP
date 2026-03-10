"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import {
  Paperclip,
  Trash2,
  Activity,
  FileText,
  Calendar as CalendarIcon,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { addRecentTask } from "@/lib/recent-items";
import { useI18n } from "@/lib/i18n";

// Helper function to display localized "Me" for current user
const getDisplayName = (userId: number | undefined | null, username: string | undefined, currentUserId: number | null, meLabel: string): string => {
  if (!username) return "";
  if (currentUserId && userId && Number(currentUserId) === Number(userId)) {
    return meLabel;
  }
  return username;
};

interface TaskDetailModalProps {
  task: Task;
  projectId: number;
  projectName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
  onTaskUpdated?: (updatedTask: Task) => void;
  onTaskDeleted?: (taskId: number) => void;
  members: User[];
  ownerId?: number;
}

export function TaskDetailModal({
  task,
  projectId,
  projectName,
  open,
  onOpenChange,
  onUpdate,
  onTaskUpdated,
  onTaskDeleted,
  members,
  ownerId,
}: TaskDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteAttachmentDialog, setShowDeleteAttachmentDialog] = useState<number | null>(null);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, locale, getStatusLabel } = useI18n();
  const dateLocale = locale === 'vi' ? vi : enUS;

  // Get current user ID and is_staff from JWT token
  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("🔍 JWT Payload:", payload);
        setCurrentUserId(payload.user_id);
        setIsAdmin(payload.is_staff || false);
      }
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }, []);

  // Debug logging for permission check
  useEffect(() => {
    if (open && currentUserId !== null && ownerId !== undefined) {
      console.log("🔍 Permission Debug:");
      console.log("   currentUserId:", currentUserId, typeof currentUserId);
      console.log("   ownerId:", ownerId, typeof ownerId);
      console.log("   isAdmin:", isAdmin);
      console.log("   Can assign?", isAdmin || Number(currentUserId) === Number(ownerId));
    }
  }, [open, currentUserId, ownerId, isAdmin]);

  // Track task visit when modal opens
  useEffect(() => {
    if (open && task) {
      addRecentTask(
        task.id, 
        task.title, 
        projectId > 0 ? projectId : undefined, 
        projectName
      );
    }
  }, [open, task, projectId, projectName]);

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
      setError(null);
      const updatedTask = await taskService.update(task.id, data);
      toast.success(t.messages.taskUpdated);
      // Optimistic update - notify parent immediately with new data
      if (onTaskUpdated) {
        onTaskUpdated(updatedTask);
      } else if (onUpdate) {
        onUpdate();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t.messages.error;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      setError(null);
      await commentService.create(task.id, newComment);
      setNewComment("");
      fetchData();
      toast.success(t.messages.commentSent);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t.messages.error;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentBody(comment.body);
  };

  const handleUpdateComment = async () => {
    if (!editingCommentBody.trim() || editingCommentId === null) return;
    try {
      setError(null);
      await commentService.update(
        task.id,
        editingCommentId,
        editingCommentBody,
      );
      setEditingCommentId(null);
      setEditingCommentBody("");
      fetchData();
      toast.success(t.messages.commentUpdated);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t.messages.error;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentBody("");
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      setError(null);
      setShowDeleteCommentDialog(null);
      await commentService.delete(task.id, commentId);
      fetchData();
      toast.success(t.messages.commentDeleted);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t.messages.error;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      setError(null);
      await attachmentService.upload(task.id, file);
      fetchData();
      toast.success(t.messages.fileUploaded);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t.messages.error;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      setError(null);
      await attachmentService.delete(task.id, attachmentId);
      fetchData();
      toast.success(t.messages.fileDeleted);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t.messages.error;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setShowDeleteAttachmentDialog(null);
    }
  };

  // Check if user can delete task
  const canDeleteTask = () => {
    // Get creator ID - could be number or object with id
    const creatorId = typeof task.created_by === 'object' 
      ? (task.created_by as { id: number })?.id 
      : task.created_by;
    
    if (isAdmin) return true;
    
    // Convert to number for comparison (currentUserId might be string from JWT)
    const currentUserIdNum = Number(currentUserId);
    const creatorIdNum = Number(creatorId);
    const ownerIdNum = Number(ownerId);
    
    // Personal task: only creator can delete
    if (task.is_personal) {
      return currentUserIdNum === creatorIdNum;
    }
    
    // Project task: project owner OR task creator can delete
    const isOwner = currentUserIdNum === ownerIdNum;
    const isCreator = currentUserIdNum === creatorIdNum;
    return isOwner || isCreator;
  };

  const handleDeleteTask = async () => {
    try {
      setError(null);
      await taskService.delete(task.id);
      toast.success(t.messages.taskDeleted);
      setShowDeleteDialog(false);
      onOpenChange(false);
      // Optimistic delete - notify parent immediately
      if (onTaskDeleted) {
        onTaskDeleted(task.id);
      } else if (onUpdate) {
        onUpdate();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t.messages.error;
      setError(errorMsg);
      toast.error(errorMsg);
      setShowDeleteDialog(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogTitle className="sr-only">Task Details - {task.title}</DialogTitle>
        <DialogDescription className="sr-only">
          View and edit the details of this task including comments and attachments.
        </DialogDescription>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 mx-6 mt-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-red-800 dark:text-red-400 font-semibold">{t.messages.error}</h3>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-6 pb-4 border-b dark:border-slate-700">
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
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t.task.inList}{" "}
                  <strong>
                    {getStatusLabel(task.status)}
                  </strong>
                </span>
              </div>
            </div>
            {/* Actions Dropdown */}
            {canDeleteTask() && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t.task.deleteTask}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content (Left) */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8">
              {/* Description */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" /> {t.common.description}
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
                        {t.common.save}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingDesc(false)}
                      >
                        {t.common.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="bg-gray-50 dark:bg-slate-800 p-4 rounded-md text-sm min-h-25 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                    onClick={() => setIsEditingDesc(true)}
                  >
                    {description || t.task.noDescription}
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Paperclip className="w-4 h-4" /> {t.common.attachments}
                </h3>
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 border dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded flex items-center justify-center font-bold text-gray-500 dark:text-gray-400">
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
                          <span className="text-xs text-gray-500 dark:text-gray-400">
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
                        onClick={() => setShowDeleteAttachmentDialog(att.id)}
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
                      title={t.task.addFile}
                      aria-label={t.task.addFile}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? t.messages.uploading : t.task.addFile}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Activity - Only for project tasks */}
              {!task.is_personal && (
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4" /> {t.common.comments}
                  </h3>

                  {/* Comment Input */}
                  <div className="flex gap-3 mb-6 pb-6 border-b dark:border-slate-700">
                    <Avatar>
                      <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder={t.task.writeComment}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Button size="sm" onClick={handleSendComment}>
                        {t.common.save}
                      </Button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.map((c, idx) => (
                      <div key={idx} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {c.author?.username?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-semibold">
                              {getDisplayName(c.author?.id, c.author?.username, currentUserId, t.common.me)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">
                              {formatDistanceToNow(new Date(c.created_at), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </span>
                          </div>
                          {editingCommentId === c.id ? (
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
                                  {t.common.save}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                >
                                  {t.common.cancel}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <div className="flex-1 text-sm bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 rounded mt-1 shadow-sm">
                                {c.body}
                              </div>
                              <div className="flex gap-1 mt-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleEditComment(c)}
                                >
                                  {t.common.edit}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                  onClick={() => setShowDeleteCommentDialog(c.id)}
                                >
                                  {t.common.delete}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Sidebar (Right) */}
          <div className="w-64 bg-gray-50 dark:bg-slate-900 border-l dark:border-slate-700 p-4 space-y-6">
            {/* Assignee - Only for project tasks */}
            {!task.is_personal && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  {t.common.member}
                </h4>
                <Select
                  value={task.assignee?.id.toString() || "unassigned"}
                  onValueChange={(val) =>
                    handleUpdateTask({
                      assignee_id: val === "unassigned" ? null : parseInt(val),
                    })
                  }
                  disabled={!isAdmin && !!ownerId && Number(currentUserId) !== Number(ownerId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.messages.selectMember} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">{t.common.unassigned}</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {getDisplayName(m.id, m.username, currentUserId, t.common.me)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isAdmin && ownerId && Number(currentUserId) !== Number(ownerId) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t.messages.onlyOwnerCanAssign}
                  </p>
                )}
              </div>
            )}

            {/* Priority */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                {t.common.priority}
              </h4>
              <Select
                value={task.priority}
                onValueChange={(val) => handleUpdateTask({ priority: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">{t.taskPriority.low}</SelectItem>
                  <SelectItem value="MED">{t.taskPriority.medium}</SelectItem>
                  <SelectItem value="HIGH">{t.taskPriority.high}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                {t.common.dueDate}
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
                      format(new Date(task.due_date), "PPP", { locale: dateLocale })
                    ) : (
                      <span>{t.messages.selectDate}</span>
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

            {/* Activity Log - Only for project tasks */}
            {!task.is_personal && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> {t.common.activity}
                </h4>
                <ScrollArea className="h-64 pr-4">
                  <div className="space-y-3 text-xs">
                    {activities.length > 0 ? (
                      activities
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((log, idx) => (
                          <div key={idx} className="pb-3 border-b dark:border-slate-700 last:border-0">
                            <div className="font-medium text-gray-700 dark:text-gray-300">
                              {getDisplayName(log.actor?.id, log.actor?.username, currentUserId, t.common.me)}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                              {log.action_description}
                            </div>
                            <div className="text-gray-400 dark:text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(log.timestamp), {
                                addSuffix: true,
                                locale: dateLocale,
                              })}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500 italic">{t.task.noActivity}</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Delete Task Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.task.deleteTask}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.task.deleteTaskConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Attachment Confirmation Dialog */}
      <AlertDialog
        open={showDeleteAttachmentDialog !== null}
        onOpenChange={(open) => !open && setShowDeleteAttachmentDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.messages.deleteAttachment}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.messages.deleteAttachmentConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (showDeleteAttachmentDialog !== null) {
                  handleDeleteAttachment(showDeleteAttachmentDialog);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Confirmation Dialog */}
      <AlertDialog
        open={showDeleteCommentDialog !== null}
        onOpenChange={(open) => !open && setShowDeleteCommentDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.messages.deleteComment}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.messages.deleteCommentConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (showDeleteCommentDialog !== null) {
                  handleDeleteComment(showDeleteCommentDialog);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
