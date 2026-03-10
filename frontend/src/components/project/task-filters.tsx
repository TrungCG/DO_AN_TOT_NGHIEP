"use client";

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TaskFiltersState {
  search: string;
  status: string | null;
  priority: string | null;
  dateRange: "all" | "today" | "week" | "month" | "overdue";
  type: "all" | "personal" | "project";
  assigneeId?: number;
}

interface TaskFiltersProps {
  filters: TaskFiltersState;
  onFiltersChange: (filters: TaskFiltersState) => void;
  showPersonalToggle?: boolean;
}

export function TaskFilters({
  filters,
  onFiltersChange,
  showPersonalToggle = true,
}: TaskFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (status: string | null) => {
    onFiltersChange({ ...filters, status });
    setIsOpen(false);
  };

  const handlePriorityChange = (priority: string | null) => {
    onFiltersChange({ ...filters, priority });
    setIsOpen(false);
  };

  const handleDateRangeChange = (
    dateRange: "all" | "today" | "week" | "month" | "overdue"
  ) => {
    onFiltersChange({ ...filters, dateRange });
    setIsOpen(false);
  };

  const handleTypeChange = (type: "all" | "personal" | "project") => {
    onFiltersChange({ ...filters, type });
    setIsOpen(false);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: null,
      priority: null,
      dateRange: "all",
      type: "all",
    });
  };

  const activeFiltersCount = [
    filters.search ? 1 : 0,
    filters.status ? 1 : 0,
    filters.priority ? 1 : 0,
    filters.dateRange !== "all" ? 1 : 0,
    filters.type !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4 mb-6 p-4 bg-background border rounded-lg">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm công việc..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={filters.status ? "bg-blue-50 dark:bg-blue-950" : ""}
            >
              Trạng thái {filters.status && `(${filters.status})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Trạng thái</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStatusChange(null)}>
              Tất cả
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("TODO")}>
              To Do
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("INPR")}>
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("DONE")}>
              Done
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={filters.priority ? "bg-blue-50 dark:bg-blue-950" : ""}
            >
              Độ ưu tiên {filters.priority && `(${filters.priority})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Độ ưu tiên</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlePriorityChange(null)}>
              Tất cả
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityChange("LOW")}>
              Thấp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityChange("MED")}>
              Trung bình
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityChange("HIGH")}>
              Cao
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date Range Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={
                filters.dateRange !== "all"
                  ? "bg-blue-50 dark:bg-blue-950"
                  : ""
              }
            >
              Thời hạn {filters.dateRange !== "all" && `(${filters.dateRange})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Thời hạn</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDateRangeChange("all")}>
              Tất cả
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDateRangeChange("overdue")}>
              Quá hạn
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDateRangeChange("today")}>
              Hôm nay
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDateRangeChange("week")}>
              Tuần này
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDateRangeChange("month")}>
              Tháng này
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Type Filter */}
        {showPersonalToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={filters.type !== "all" ? "bg-blue-50 dark:bg-blue-950" : ""}
              >
                Loại {filters.type !== "all" && `(${filters.type})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Loại công việc</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleTypeChange("all")}>
                Tất cả
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange("personal")}>
                Cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange("project")}>
                Dự án
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Xóa tất cả ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => handleSearchChange("")}
            >
              Tìm: {filters.search} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {filters.status && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => handleStatusChange(null)}
            >
              Trạng thái: {filters.status} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {filters.priority && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => handlePriorityChange(null)}
            >
              Độ ưu tiên: {filters.priority} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {filters.dateRange !== "all" && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => handleDateRangeChange("all")}
            >
              Thời hạn: {filters.dateRange} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {filters.type !== "all" && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => handleTypeChange("all")}
            >
              Loại: {filters.type} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
