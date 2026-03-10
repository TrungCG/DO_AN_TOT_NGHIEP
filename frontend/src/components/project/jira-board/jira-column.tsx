"use client";

import { useDroppable } from "@dnd-kit/core";
import { TaskStatus } from "@/types/task";
import { Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface JiraColumnProps {
  id: TaskStatus;
  title: string;
  count: number;
  children: React.ReactNode;
  onCreateTask?: () => void;
  showSettings?: boolean;
}

export function JiraColumn({
  id,
  title,
  count,
  children,
  onCreateTask,
  showSettings = false,
}: JiraColumnProps) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-gray-100 dark:bg-slate-900/70 rounded-sm min-w-[280px] w-[280px]",
        "transition-all duration-200",
        isOver && "bg-blue-50 dark:bg-blue-950/30"
      )}
    >
      {/* Column Header - Jira Style */}
      <div className="px-2 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            {title}
          </h3>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {count}
          </span>
        </div>
        
        {showSettings && (
          <button 
            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
            title="Cài đặt cột"
          >
            <Settings className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Cards Container */}
      <div className="flex-1 space-y-1.5 px-1.5 py-1 overflow-y-auto min-h-[100px]">
        {children}
      </div>

      {/* Create Task Button - Jira Style */}
      {onCreateTask && (
        <button
          onClick={onCreateTask}
          className={cn(
            "flex items-center gap-1 px-2 py-2 mx-1.5 mb-1.5 rounded-sm",
            "text-sm text-gray-600 dark:text-gray-400",
            "hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          )}
        >
          <Plus className="h-4 w-4" />
          <span>{t.common.create}</span>
        </button>
      )}
    </div>
  );
}
