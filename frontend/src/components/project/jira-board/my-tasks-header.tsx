"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { 
  LayoutGrid, 
  List, 
  Calendar, 
  Clock, 
  FileText, 
  User,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MyTasksHeaderProps {
  taskCount: number;
  totalCount: number;
  activeTab: "board" | "list" | "calendar" | "timeline" | "summary";
  onTabChange: (tab: "board" | "list" | "calendar" | "timeline" | "summary") => void;
  onCreateTask?: () => void;
}

export function MyTasksHeader({
  taskCount,
  totalCount,
  activeTab,
  onTabChange,
  onCreateTask,
}: MyTasksHeaderProps) {
  const { t, locale } = useI18n();
  
  const tabs = [
    { id: "summary", label: t.project.overview, icon: FileText },
    { id: "board", label: t.project.board, icon: LayoutGrid },
    { id: "list", label: t.project.list, icon: List },
    { id: "calendar", label: t.project.calendar, icon: Calendar },
    { id: "timeline", label: t.project.timeline, icon: Clock },
  ] as const;

  return (
    <div className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950">
      {/* Header Info Row */}
      <div className="px-6 pt-4 pb-3">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t.sidebar.myTasks}
                </h1>
                <Badge 
                  variant="secondary" 
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                >
                  {t.dashboard.personalBadge}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {taskCount} / {totalCount} {locale === 'vi' ? 'công việc' : 'tasks'}
              </p>
            </div>
          </div>

          {/* Right: Create Task Button */}
          <Button 
            onClick={onCreateTask}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t.task.createTask}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap",
                "border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
