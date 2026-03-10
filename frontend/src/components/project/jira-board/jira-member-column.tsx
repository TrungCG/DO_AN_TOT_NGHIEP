"use client";

import { Task } from "@/types/task";
import { User } from "@/types/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { JiraTaskCard } from "./jira-task-card";
import { UserX } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn, getAvatarColor } from "@/lib/utils";

interface JiraMemberColumnProps {
  member: User | null;
  tasks: Task[];
  projectKey?: string;
  onTaskClick: (task: Task) => void;
  currentUserId?: number;
}

export function JiraMemberColumn({
  member,
  tasks,
  projectKey = "DATN",
  onTaskClick,
  currentUserId,
}: JiraMemberColumnProps) {
  const { getStatusLabel } = useI18n();
  // Group tasks by status for display
  const todoTasks = tasks.filter((t) => t.status === "TODO");
  const inProgressTasks = tasks.filter((t) => t.status === "INPR");
  const doneTasks = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="flex flex-col bg-gray-100 dark:bg-slate-900/70 rounded-sm min-w-[280px] w-[280px]">
      {/* Member Header */}
      <div className="px-3 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-slate-700">
        {member ? (
          <>
            <Avatar className="h-7 w-7">
              <AvatarFallback className={cn("text-xs font-bold text-white", getAvatarColor(member.id))}>
                {member.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {currentUserId && member.id === currentUserId ? "Tôi" : member.username}
              </h3>
              {member.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {member.email}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="h-7 w-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <UserX className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Chưa phân công
              </h3>
            </div>
          </>
        )}
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Tasks organized by status */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Todo Section */}
        {todoTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1.5 px-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {getStatusLabel("TODO")} ({todoTasks.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {todoTasks.map((task) => (
                <JiraTaskCard
                  key={`todo-${task.id}`}
                  task={task}
                  projectKey={projectKey}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          </div>
        )}

        {/* In Progress Section */}
        {inProgressTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1.5 px-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {getStatusLabel("INPR")} ({inProgressTasks.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {inProgressTasks.map((task) => (
                <JiraTaskCard
                  key={`inpr-${task.id}`}
                  task={task}
                  projectKey={projectKey}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Done Section */}
        {doneTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1.5 px-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                {getStatusLabel("DONE")} ({doneTasks.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {doneTasks.map((task) => (
                <JiraTaskCard
                  key={`done-${task.id}`}
                  task={task}
                  projectKey={projectKey}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            Không có công việc
          </div>
        )}
      </div>
    </div>
  );
}
