"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/task";
import { Calendar, AlertTriangle, Flag } from "lucide-react";
import { formatDistanceToNow, isPast, isToday, isTomorrow, format } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getAvatarColor } from "@/lib/utils";

interface DraggableTaskCardProps {
  task: Task;
  onClick: () => void;
}

export function DraggableTaskCard({ task, onClick }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id.toString(),
    data: { task },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 1000 : undefined,
        opacity: isDragging ? 0.8 : 1,
      }
    : undefined;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return { bg: "bg-red-50 dark:bg-red-950/20", dot: "bg-red-500", text: "text-red-700 dark:text-red-400" };
      case "MED":
        return { bg: "bg-yellow-50 dark:bg-yellow-950/20", dot: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-400" };
      case "LOW":
        return { bg: "bg-green-50 dark:bg-green-950/20", dot: "bg-green-500", text: "text-green-700 dark:text-green-400" };
      default:
        return { bg: "bg-gray-50 dark:bg-gray-950/20", dot: "bg-gray-400", text: "text-gray-600 dark:text-gray-400" };
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "Cao";
      case "MED":
        return "Trung bình";
      case "LOW":
        return "Thấp";
      default:
        return priority;
    }
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    return format(due, "dd MMM", { locale: vi });
  };

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "DONE";
  const isDueToday = task.due_date && isToday(new Date(task.due_date));
  const isDueSoon = task.due_date && !isOverdue && !isDueToday && 
    new Date(task.due_date) <= new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  const priorityColor = getPriorityColor(task.priority);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="touch-none"
      onClick={() => {
        if (!isDragging) {
          onClick();
        }
      }}
    >
      <div 
        className={cn(
          "bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3",
          "hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
          "hover:border-gray-300 dark:hover:border-slate-600"
        )}
      >
        {/* Task ID and Priority Indicator */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
              DATN-{task.id}
            </span>
            {task.priority === "HIGH" && (
              <div className={cn("h-2.5 w-2.5 rounded-full", priorityColor.dot)} title="Độ ưu tiên Cao" />
            )}
          </div>
        </div>

        {/* Task Title */}
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-3 mb-2 leading-snug">
          {task.title}
        </h4>

        {/* Description if exists */}
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        {/* Bottom Row: Due Date and Assignee */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
          <div className="flex-1 flex items-center gap-1">
            {/* Due Date */}
            {task.due_date && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                isOverdue ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                isDueToday ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" :
                isDueSoon ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}>
                <Calendar className="w-3 h-3" />
                <span>{formatDueDate(task.due_date)}</span>
              </div>
            )}
          </div>

          {/* Assignee Avatar */}
          {task.assignee && (
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarFallback className={cn("text-xs font-bold text-white", getAvatarColor(task.assignee.id))}>
                {task.assignee.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
