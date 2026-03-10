"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/task";
import { Check, Minus, ChevronUp, ChevronDown, Equal, Clock, AlertTriangle, Calendar } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getAvatarColor } from "@/lib/utils";
import { format, isToday, isPast, parseISO } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useI18n } from "@/lib/i18n";

interface JiraTaskCardProps {
  task: Task;
  onClick: () => void;
  projectKey?: string;
}

export function JiraTaskCard({ task, onClick, projectKey = "DATN" }: JiraTaskCardProps) {
  const { locale } = useI18n();
  const dateLocale = locale === 'vi' ? vi : enUS;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id.toString(),
    data: { task },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 1000 : 1,
      }
    : undefined;

  // Priority icon và color theo Jira style
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <ChevronUp className="h-4 w-4 text-red-500" />;
      case "MED":
        return <Equal className="h-4 w-4 text-orange-500" />;
      case "LOW":
        return <ChevronDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const isDone = task.status === "DONE";

  // Due date helpers
  const getDueDateInfo = () => {
    if (!task.due_date) return null;
    
    const dueDate = parseISO(task.due_date);
    const formattedDate = format(dueDate, "PPP", { locale: dateLocale });
    
    if (isDone) {
      return {
        icon: <Calendar className="h-3 w-3" />,
        text: formattedDate,
        className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      };
    }
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return {
        icon: <AlertTriangle className="h-3 w-3" />,
        text: formattedDate,
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      };
    }
    
    if (isToday(dueDate)) {
      return {
        icon: <Clock className="h-3 w-3" />,
        text: formattedDate,
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      };
    }
    
    return {
      icon: <Calendar className="h-3 w-3" />,
      text: formattedDate,
      className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    };
  };

  const dueDateInfo = getDueDateInfo();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="touch-none"
      onClick={onClick}
    >
      <div
        className={cn(
          "bg-white dark:bg-slate-800 rounded-sm shadow-sm",
          "border border-gray-200 dark:border-slate-700",
          "hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer",
          "px-3 py-2.5",
          isDragging && "opacity-50 shadow-lg"
        )}
      >
        {/* Task Title */}
        <h4 className={cn(
          "text-sm text-gray-900 dark:text-gray-100 mb-2 leading-snug",
          isDone && "line-through text-gray-500 dark:text-gray-400"
        )}>
          {task.title}
        </h4>

        {/* Due Date Badge */}
        {dueDateInfo && (
          <div className="mb-2">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
              dueDateInfo.className
            )}>
              {dueDateInfo.icon}
              {dueDateInfo.text}
            </span>
          </div>
        )}

        {/* Bottom Row: Task ID, Priority, Status Check, Assignee */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Checkbox + Task ID */}
          <div className="flex items-center gap-2">
            {/* Checkbox indicator */}
            <div className={cn(
              "w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0",
              isDone 
                ? "bg-blue-500 border-blue-500" 
                : "border-gray-300 dark:border-gray-600"
            )}>
              {isDone && <Check className="h-3 w-3 text-white" />}
            </div>
            
            {/* Task ID */}
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {projectKey}-{task.id}
            </span>
          </div>

          {/* Right: Priority + Assignee */}
          <div className="flex items-center gap-2">
            {/* Priority Icon */}
            {getPriorityIcon(task.priority)}
            
            {/* Assignee Avatar */}
            {task.assignee ? (
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarFallback className={cn("text-xs font-bold text-white", getAvatarColor(task.assignee.id))}>
                  {task.assignee.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-6 w-6 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <span className="text-xs text-gray-400">?</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
