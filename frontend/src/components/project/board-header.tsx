"use client";

import { useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BoardHeaderProps {
  viewMode: "status" | "member";
  onViewModeChange: (mode: "status" | "member") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  onCreateTask: () => void;
}

export function BoardHeader({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  totalTasks,
  completedTasks,
  inProgressTasks,
  onCreateTask,
}: BoardHeaderProps) {
  const { t } = useI18n();
  const [showFilters, setShowFilters] = useState(false);
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Top Row: Title and Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Board</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalTasks} {t.project.tasks} • {completionPercentage}% {t.project.completion}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateTask}
            className="gap-2"
          >
            <span>+ Tạo</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <span className="text-xs">Xem:</span>
                <span className="font-semibold">{viewMode === "status" ? "Trạng thái" : "Thành viên"}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewModeChange("status")}>
                <span className="flex items-center gap-2">
                  {viewMode === "status" && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  Theo trạng thái
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewModeChange("member")}>
                <span className="flex items-center gap-2">
                  {viewMode === "member" && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  Theo thành viên
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600" />
          <Input
            placeholder={t.listView.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title={t.common.close}
              aria-label={t.common.close}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          <span>Bộ lọc</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-3">
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Tổng cộng:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-50">{totalTasks}</span>
        </div>
        <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center gap-2 text-sm">
          <span className="text-blue-600 dark:text-blue-400">Đang làm:</span>
          <span className="font-semibold text-blue-700 dark:text-blue-300">{inProgressTasks}</span>
        </div>
        <div className="px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center gap-2 text-sm">
          <span className="text-green-600 dark:text-green-400">Hoàn thành:</span>
          <span className="font-semibold text-green-700 dark:text-green-300">{completedTasks}</span>
        </div>
        {/* Progress bar */}
        <div className="flex-1 max-w-xs flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 min-w-fit">
            {completionPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}
