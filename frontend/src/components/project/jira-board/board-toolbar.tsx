"use client";

import { useState } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { User } from "@/types/auth";
import { cn, getAvatarColor } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

export interface FilterState {
  priority: "HIGH" | "MED" | "LOW" | null;
  status: "TODO" | "INPR" | "DONE" | null;
}

interface BoardToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  members: User[];
  selectedMemberId?: number | null;
  onMemberSelect?: (memberId: number | null) => void;
  groupBy: "status" | "member";
  onGroupByChange: (groupBy: "status" | "member") => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isPersonal?: boolean;
}

export function BoardToolbar({
  searchQuery,
  onSearchChange,
  members,
  selectedMemberId,
  onMemberSelect,
  groupBy,
  onGroupByChange,
  filters,
  onFiltersChange,
  isPersonal = false,
}: BoardToolbarProps) {
  const [showAllMembers, setShowAllMembers] = useState(false);
  const { getDisplayName } = useCurrentUser();
  const { t, locale, getStatusLabel, getPriorityLabel } = useI18n();
  const displayMembers = showAllMembers ? members : members.slice(0, 4);

  const hasActiveFilters = filters.priority !== null || filters.status !== null;

  const clearFilters = () => {
    onFiltersChange({ priority: null, status: null });
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      {/* Left: Search + Member Avatars + Lọc */}
      <div className="flex items-center gap-3">
        {/* Search Input - Jira Style */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t.common.search}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "pl-8 h-8 w-[160px] text-sm",
              "bg-transparent border-gray-300 dark:border-slate-600",
              "focus:w-[240px] transition-all duration-200"
            )}
          />
        </div>

        {/* Member Avatar Filter */}
        <div className="flex items-center">
          <div className="flex -space-x-1">
            {displayMembers.map((member) => (
              <button
                key={`toolbar-member-${member.id}`}
                onClick={() => onMemberSelect?.(
                  selectedMemberId === member.id ? null : member.id
                )}
                className={cn(
                  "relative rounded-full transition-all",
                  selectedMemberId === member.id 
                    ? "ring-2 ring-blue-500 z-10" 
                    : "hover:z-10 hover:ring-2 hover:ring-gray-400"
                )}
                title={getDisplayName(member.id, member.username)}
              >
                <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800">
                  <AvatarFallback className={cn(
                    "text-xs font-bold text-white",
                    getAvatarColor(member.id)
                  )}>
                    {member.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            ))}
          </div>
          
          {members.length > 4 && !showAllMembers && (
            <button
              onClick={() => setShowAllMembers(true)}
              className="ml-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              +{members.length - 4}
            </button>
          )}
        </div>

        {/* Lọc Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={hasActiveFilters ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8",
                hasActiveFilters 
                  ? "bg-blue-500 text-white hover:bg-blue-600" 
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              {t.common.filter}
              {hasActiveFilters && (
                <span className="ml-1 bg-white text-blue-600 rounded-full w-4 h-4 text-xs flex items-center justify-center">
                  {(filters.priority ? 1 : 0) + (filters.status ? 1 : 0)}
                </span>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {/* Priority Filter */}
            <DropdownMenuLabel className="text-xs text-gray-500">{t.common.priority}</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => onFiltersChange({ ...filters, priority: filters.priority === "HIGH" ? null : "HIGH" })}
              className={cn(filters.priority === "HIGH" && "bg-red-50 dark:bg-red-900/20")}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                {t.taskPriority.high}
                {filters.priority === "HIGH" && <span className="ml-auto text-blue-500">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onFiltersChange({ ...filters, priority: filters.priority === "MED" ? null : "MED" })}
              className={cn(filters.priority === "MED" && "bg-orange-50 dark:bg-orange-900/20")}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                {t.taskPriority.medium}
                {filters.priority === "MED" && <span className="ml-auto text-blue-500">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onFiltersChange({ ...filters, priority: filters.priority === "LOW" ? null : "LOW" })}
              className={cn(filters.priority === "LOW" && "bg-green-50 dark:bg-green-900/20")}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {t.taskPriority.low}
                {filters.priority === "LOW" && <span className="ml-auto text-blue-500">✓</span>}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Status Filter */}
            <DropdownMenuLabel className="text-xs text-gray-500">{t.common.status}</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => onFiltersChange({ ...filters, status: filters.status === "TODO" ? null : "TODO" })}
              className={cn(filters.status === "TODO" && "bg-gray-100 dark:bg-gray-800")}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full" />
                {t.taskStatus.todo}
                {filters.status === "TODO" && <span className="ml-auto text-blue-500">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onFiltersChange({ ...filters, status: filters.status === "INPR" ? null : "INPR" })}
              className={cn(filters.status === "INPR" && "bg-blue-50 dark:bg-blue-900/20")}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                {t.taskStatus.inProgress}
                {filters.status === "INPR" && <span className="ml-auto text-blue-500">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onFiltersChange({ ...filters, status: filters.status === "DONE" ? null : "DONE" })}
              className={cn(filters.status === "DONE" && "bg-green-50 dark:bg-green-900/20")}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-600 rounded-full" />
                {t.taskStatus.done}
                {filters.status === "DONE" && <span className="ml-auto text-blue-500">✓</span>}
              </span>
            </DropdownMenuItem>

            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearFilters} className="text-red-500">
                  <X className="h-4 w-4 mr-2" />
                  {locale === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1">
            {filters.priority && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                filters.priority === "HIGH" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                filters.priority === "MED" && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                filters.priority === "LOW" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              )}>
                {getPriorityLabel(filters.priority)}
                <button 
                  onClick={() => onFiltersChange({ ...filters, priority: null })}
                  className="hover:bg-black/10 rounded-full p-0.5"
                  title={locale === 'vi' ? 'Xóa bộ lọc độ ưu tiên' : 'Clear priority filter'}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                filters.status === "TODO" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                filters.status === "INPR" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                filters.status === "DONE" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              )}>
                {getStatusLabel(filters.status)}
                <button 
                  onClick={() => onFiltersChange({ ...filters, status: null })}
                  className="hover:bg-black/10 rounded-full p-0.5"
                  title={locale === 'vi' ? 'Xóa bộ lọc trạng thái' : 'Clear status filter'}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Group By Dropdown - Hide for personal tasks */}
      <div className="flex items-center gap-2">
        {!isPersonal && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-sm font-normal border-gray-300 dark:border-slate-600"
            >
              <span className="text-gray-500 mr-1">{t.common.groupBy}:</span>
              <span className="font-medium">
                {groupBy === "status" ? t.common.status : t.common.member}
              </span>
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onGroupByChange("status")}>
              <span className="flex items-center gap-2">
                {groupBy === "status" && (
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
                {t.common.status}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onGroupByChange("member")}>
              <span className="flex items-center gap-2">
                {groupBy === "member" && (
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
                {t.common.member}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )}
      </div>
    </div>
  );
}
