"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
import { User } from "@/types/auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Equal,
  Search,
  Filter,
  Check,
  Plus
} from "lucide-react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isToday,
  parseISO,
  differenceInDays,
  addDays,
  getWeek,
  startOfDay
} from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { TaskDetailModal } from "../task-detail-modal";
import { CreateTaskDialog } from "../create-task-dialog";
import { taskService } from "@/services/task";
import { toast } from "sonner";

interface JiraTimelineViewProps {
  projectId: number;
  projectKey?: string;
  projectName?: string;
  tasks: Task[];
  members: User[];
  ownerId?: number;
  onTaskUpdate: () => void | Promise<void>;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: number) => void;
}

type ViewMode = "week" | "month" | "quarter";

export function JiraTimelineView({
  projectId,
  projectKey = "DATN",
  projectName,
  tasks,
  members,
  ownerId,
  onTaskUpdate,
  onTaskUpdated,
  onTaskDeleted,
}: JiraTimelineViewProps) {
  const { t, locale } = useI18n();
  const dateLocale = locale === 'vi' ? vi : enUS;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { getDisplayName } = useCurrentUser();

  // Drag state
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dragType, setDragType] = useState<"move" | "resize-start" | "resize-end" | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesId = `${projectKey}-${task.id}`.toLowerCase().includes(query);
        if (!matchesTitle && !matchesId) return false;
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(task.status)) return false;

      // Priority filter
      if (priorityFilter.length > 0 && !priorityFilter.includes(task.priority)) return false;

      // Assignee filter
      if (assigneeFilter.length > 0) {
        if (!task.assignee || !assigneeFilter.includes(task.assignee.id)) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter, projectKey]);

  // Get timeline range based on view mode
  const timelineRange = useMemo(() => {
    let start: Date;
    let end: Date;
    
    switch (viewMode) {
      case "week":
        // Show 1 week before and 5 weeks after (total ~6 weeks like Jira)
        start = subWeeks(startOfWeek(currentDate, { weekStartsOn: 1 }), 1);
        end = addWeeks(endOfWeek(currentDate, { weekStartsOn: 1 }), 5);
        break;
      case "month":
        // Show 1 month before and 4 months after
        start = subMonths(startOfMonth(currentDate), 1);
        end = addMonths(endOfMonth(currentDate), 4);
        break;
      case "quarter":
        // Show 3 months before and 9 months after
        start = subMonths(startOfMonth(currentDate), 3);
        end = addMonths(endOfMonth(currentDate), 9);
        break;
    }
    
    return eachDayOfInterval({ start, end });
  }, [currentDate, viewMode]);

  // Get day width based on view mode
  const getDayWidth = () => {
    switch (viewMode) {
      case "week": return 40;
      case "month": return 24;
      case "quarter": return 12;
    }
  };

  // Get status color for task bar
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-green-500";
      case "INPR":
        return "bg-blue-500";
      default:
        return "bg-gray-400";
    }
  };

  // Calculate bar position for a task
  const getTaskBarStyle = (task: Task) => {
    const dayWidth = getDayWidth();
    const today = startOfDay(new Date());
    
    // Determine start date - prioritize start_date, then created_at, then today
    let startDate: Date;
    if (task.start_date) {
      startDate = startOfDay(parseISO(task.start_date));
    } else if (task.due_date) {
      // If only due_date exists, start 3 days before due_date
      startDate = startOfDay(addDays(parseISO(task.due_date), -3));
    } else if (task.created_at) {
      startDate = startOfDay(parseISO(task.created_at));
    } else {
      startDate = today;
    }
    
    // Determine end date
    const endDate = task.due_date ? startOfDay(parseISO(task.due_date)) : addDays(startDate, 3);
    
    const timelineStart = startOfDay(timelineRange[0]);
    const startOffset = differenceInDays(startDate, timelineStart);
    const duration = Math.max(1, differenceInDays(endDate, startDate) + 1);
    
    return {
      left: `${startOffset * dayWidth}px`,
      width: `${duration * dayWidth - 4}px`,
    };
  };

  // Navigation
  const goToPrevious = () => {
    switch (viewMode) {
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case "quarter":
        setCurrentDate(subMonths(currentDate, 3));
        break;
    }
  };

  const goToNext = () => {
    switch (viewMode) {
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case "quarter":
        setCurrentDate(addMonths(currentDate, 3));
        break;
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Active filter count
  const activeFilterCount = statusFilter.length + priorityFilter.length + assigneeFilter.length;

  // Handle task status toggle
  const handleToggleTaskStatus = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = task.status === "DONE" ? "TODO" : "DONE";
      await taskService.update(task.id, { status: newStatus });
      toast.success(newStatus === "DONE" ? "Đã hoàn thành công việc" : "Đã mở lại công việc");
      onTaskUpdate();
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  // Calculate dragged task dates
  const getDraggedTaskDates = useCallback((task: Task) => {
    const dayWidth = getDayWidth();
    const deltaX = dragCurrentX - dragStartX;
    const daysDelta = Math.round(deltaX / dayWidth);
    const today = startOfDay(new Date());
    
    // Consistent with getTaskBarStyle logic
    let originalStart: Date;
    if (task.start_date) {
      originalStart = startOfDay(parseISO(task.start_date));
    } else if (task.due_date) {
      originalStart = startOfDay(addDays(parseISO(task.due_date), -3));
    } else if (task.created_at) {
      originalStart = startOfDay(parseISO(task.created_at));
    } else {
      originalStart = today;
    }
    const originalEnd = task.due_date ? startOfDay(parseISO(task.due_date)) : addDays(originalStart, 3);
    
    if (dragType === "move") {
      return {
        start: addDays(originalStart, daysDelta),
        end: addDays(originalEnd, daysDelta)
      };
    } else if (dragType === "resize-start") {
      const newStart = addDays(originalStart, daysDelta);
      return {
        start: newStart > originalEnd ? originalEnd : newStart,
        end: originalEnd
      };
    } else if (dragType === "resize-end") {
      const newEnd = addDays(originalEnd, daysDelta);
      return {
        start: originalStart,
        end: newEnd < originalStart ? originalStart : newEnd
      };
    }
    return { start: originalStart, end: originalEnd };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragStartX, dragCurrentX, dragType]);

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent, task: Task, type: "move" | "resize-start" | "resize-end") => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingTask(task);
    setDragType(type);
    setDragStartX(e.clientX);
    setDragCurrentX(e.clientX);
  };

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (draggingTask) {
      setDragCurrentX(e.clientX);
    }
  }, [draggingTask]);

  const handleDragEnd = useCallback(async () => {
    if (draggingTask && dragType) {
      const dates = getDraggedTaskDates(draggingTask);
      const dayWidth = getDayWidth();
      const deltaX = dragCurrentX - dragStartX;
      const daysDelta = Math.round(deltaX / dayWidth);
      
      if (daysDelta !== 0) {
        try {
          const updateData: { start_date?: string; due_date?: string } = {};
          
          if (dragType === "move") {
            // Move both dates
            updateData.start_date = format(dates.start, "yyyy-MM-dd");
            updateData.due_date = format(dates.end, "yyyy-MM-dd");
          } else if (dragType === "resize-start") {
            // Only update start date
            updateData.start_date = format(dates.start, "yyyy-MM-dd");
          } else if (dragType === "resize-end") {
            // Only update end date
            updateData.due_date = format(dates.end, "yyyy-MM-dd");
          }
          
          if (Object.keys(updateData).length > 0) {
            await taskService.update(draggingTask.id, updateData);
            toast.success("Đã cập nhật ngày công việc");
            onTaskUpdate();
          }
        } catch {
          toast.error("Lỗi khi cập nhật ngày");
        }
      }
    }
    
    setDraggingTask(null);
    setDragType(null);
    setDragStartX(0);
    setDragCurrentX(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingTask, dragType, dragStartX, dragCurrentX, getDraggedTaskDates, onTaskUpdate]);

  // Mouse event listeners for drag
  useEffect(() => {
    if (draggingTask) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [draggingTask, handleDragMove, handleDragEnd]);

  // Get dragged bar style
  const getDraggedBarStyle = (task: Task) => {
    if (draggingTask?.id !== task.id) return getTaskBarStyle(task);
    
    const dayWidth = getDayWidth();
    const dates = getDraggedTaskDates(task);
    const timelineStart = startOfDay(timelineRange[0]);
    const startOffset = differenceInDays(dates.start, timelineStart);
    const duration = Math.max(1, differenceInDays(dates.end, dates.start) + 1);
    
    return {
      left: `${startOffset * dayWidth}px`,
      width: `${duration * dayWidth - 4}px`,
    };
  };

  // Scroll to today on mount
  useEffect(() => {
    if (timelineRef.current) {
      const todayIndex = timelineRange.findIndex(day => isToday(day));
      if (todayIndex !== -1) {
        const width = getDayWidth();
        const scrollPosition = todayIndex * width - 300;
        timelineRef.current.scrollLeft = Math.max(0, scrollPosition);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineRange, viewMode]);

  // Group dates by week/month for headers
  const groupedDates = useMemo(() => {
    const groups: { label: string; key: string; days: Date[] }[] = [];
    let currentKey = "";

    // Vietnamese month names
    const monthNamesVi = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];

    if (viewMode === "quarter") {
      // Group by months in order (for quarter view, show months)
      timelineRange.forEach(day => {
        const year = day.getFullYear();
        const monthIndex = day.getMonth();
        const monthLabel = monthNamesVi[monthIndex];
        const key = `${year}-${monthIndex}`;
        
        if (key !== currentKey) {
          currentKey = key;
          groups.push({ label: monthLabel, key, days: [day] });
        } else {
          groups[groups.length - 1].days.push(day);
        }
      });
      return groups;
    }

    if (viewMode === "month") {
      // Group by full month names in Vietnamese
      timelineRange.forEach(day => {
        const year = day.getFullYear();
        const monthIndex = day.getMonth();
        const monthLabel = monthNamesVi[monthIndex];
        const key = `${year}-${monthIndex}`;
        
        if (key !== currentKey) {
          currentKey = key;
          groups.push({ label: monthLabel, key, days: [day] });
        } else {
          groups[groups.length - 1].days.push(day);
        }
      });
      return groups;
    }

    // Week view: Group by weeks with month names (like Jira)
    // Week starts on Monday (1) and ends on Sunday (0)
    const monthShortEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let weekDays: Date[] = [];
    
    timelineRange.forEach((day, index) => {
      weekDays.push(day);
      const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // End of week is Sunday (0) or last day of timeline
      const isEndOfWeek = dayOfWeek === 0;
      const isLastDay = index === timelineRange.length - 1;
      
      if (isEndOfWeek || isLastDay) {
        if (weekDays.length > 0) {
          // Get months in order of appearance (first day's month, then last day's month if different)
          const firstDayMonth = weekDays[0].getMonth();
          const lastDayMonth = weekDays[weekDays.length - 1].getMonth();
          
          // Create label like "Feb / Mar" if spanning two months, or just "Mar"
          let label: string;
          if (firstDayMonth !== lastDayMonth) {
            label = `${monthShortEn[firstDayMonth]} / ${monthShortEn[lastDayMonth]}`;
          } else {
            label = monthShortEn[firstDayMonth];
          }
          
          const firstDayOfWeek = weekDays[0];
          const year = firstDayOfWeek.getFullYear();
          const weekNum = getWeek(firstDayOfWeek, { weekStartsOn: 1, locale: dateLocale });
          const key = `${year}-w${weekNum}`;
          
          groups.push({ label, key, days: [...weekDays] });
          weekDays = [];
        }
      }
    });
    
    return groups;
  }, [timelineRange, viewMode, dateLocale]);

  const dayWidth = getDayWidth();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Member avatars */}
          <div className="flex items-center gap-1">
            {members.slice(0, 4).map((member) => (
              <button
                key={`timeline-member-${member.id}`}
                onClick={() => {
                  if (assigneeFilter.includes(member.id)) {
                    setAssigneeFilter(assigneeFilter.filter(id => id !== member.id));
                  } else {
                    setAssigneeFilter([...assigneeFilter, member.id]);
                  }
                }}
                className={cn(
                  "rounded-full transition-all",
                  assigneeFilter.includes(member.id) 
                    ? "ring-2 ring-blue-500 ring-offset-1" 
                    : "hover:ring-2 hover:ring-gray-300"
                )}
                title={getDisplayName(member.id, member.username)}
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {member.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            ))}
          </div>

          {/* Filter button */}
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button 
                variant={activeFilterCount > 0 ? "default" : "outline"} 
                size="sm" 
                className="h-9 gap-2"
              >
                <Filter className="h-4 w-4" />
                Lọc
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Bộ lọc</h4>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => {
                      setStatusFilter([]);
                      setPriorityFilter([]);
                      setAssigneeFilter([]);
                    }}>
                      Xóa tất cả
                    </Button>
                  )}
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Trạng thái</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "TODO", label: "Việc cần làm" },
                      { value: "INPR", label: "Đang tiến hành" },
                      { value: "DONE", label: "Xong" },
                    ].map((status) => (
                      <Button
                        key={`tl-status-${status.value}`}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-7",
                          statusFilter.includes(status.value) && "bg-blue-100 text-blue-700"
                        )}
                        onClick={() => {
                          if (statusFilter.includes(status.value)) {
                            setStatusFilter(statusFilter.filter(s => s !== status.value));
                          } else {
                            setStatusFilter([...statusFilter, status.value]);
                          }
                        }}
                      >
                        {statusFilter.includes(status.value) && <Check className="h-3 w-3 mr-1" />}
                        {status.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Độ ưu tiên</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "HIGH", label: "Cao", icon: <ChevronUp className="h-3 w-3 text-red-500" /> },
                      { value: "MED", label: "Trung bình", icon: <Equal className="h-3 w-3 text-yellow-500" /> },
                      { value: "LOW", label: "Thấp", icon: <ChevronDown className="h-3 w-3 text-blue-500" /> },
                    ].map((priority) => (
                      <Button
                        key={`tl-priority-${priority.value}`}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-7 gap-1",
                          priorityFilter.includes(priority.value) && "bg-gray-100 dark:bg-slate-800"
                        )}
                        onClick={() => {
                          if (priorityFilter.includes(priority.value)) {
                            setPriorityFilter(priorityFilter.filter(p => p !== priority.value));
                          } else {
                            setPriorityFilter([...priorityFilter, priority.value]);
                          }
                        }}
                      >
                        {priority.icon}
                        {priority.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* View Mode and Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hôm nay
          </Button>
          <div className="flex items-center border rounded-md">
            {(["week", "month", "quarter"] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 rounded-none first:rounded-l-md last:rounded-r-md",
                  viewMode === mode && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                )}
                onClick={() => setViewMode(mode)}
              >
                {mode === "week" ? "Tuần" : mode === "month" ? "Tháng" : "Quý"}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-950 flex-1 flex flex-col">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Task List Panel */}
          <div className="w-[300px] shrink-0 border-r flex flex-col">
            {/* Header */}
            <div className="h-[60px] border-b bg-gray-50 dark:bg-slate-900 flex items-center px-4">
              <span className="font-medium text-sm">Công việc</span>
            </div>
            
            {/* Task Rows */}
            <div className="divide-y">
              {filteredTasks.map((task) => (
                <div 
                  key={`tl-task-row-${task.id}`}
                  className="h-[40px] flex items-center gap-2 px-3 hover:bg-gray-50 dark:hover:bg-slate-900 cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  <Checkbox
                    checked={task.status === "DONE"}
                    onClick={(e) => handleToggleTaskStatus(task, e)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 shrink-0">
                    {projectKey}-{task.id}
                  </span>
                  <span className="text-sm truncate flex-1">{task.title}</span>
                </div>
              ))}
              
              {/* Add Task Row */}
              <div 
                className="h-[40px] flex items-center gap-2 px-3 hover:bg-gray-50 dark:hover:bg-slate-900 cursor-pointer text-gray-500"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">{t.common.create}</span>
                <span className="ml-auto text-sm">{filteredTasks.length} {t.common.of} {tasks.length}</span>
              </div>
            </div>
          </div>

          {/* Timeline Panel */}
          <div className="flex-1 overflow-x-auto" ref={timelineRef}>
            {/* Date Headers */}
            <div 
              className={cn(
                "border-b bg-gray-50 dark:bg-slate-900 flex flex-col",
                viewMode === "week" ? "h-[60px]" : "h-[40px]"
              )}
              style={{ minWidth: `${timelineRange.length * dayWidth}px` }}
            >
              {/* Month/Quarter/Week Row */}
              <div className={cn(
                "flex",
                viewMode === "week" ? "h-[30px] border-b" : "h-[40px]"
              )}>
                {groupedDates.map((group) => {
                  const groupWidth = group.days.length * dayWidth;
                  
                  return (
                    <div 
                      key={`header-${group.key}`}
                      className={cn(
                        "flex items-center text-sm font-medium border-r text-gray-700 dark:text-gray-300 overflow-hidden whitespace-nowrap",
                        viewMode === "quarter" && "justify-center",
                        viewMode === "month" && "justify-center",
                        viewMode === "week" && "px-2 text-xs"
                      )}
                      style={{ width: `${groupWidth}px` }}
                      title={group.label}
                    >
                      {group.label}
                    </div>
                  );
                })}
              </div>
              
              {/* Day Row - Only for week view */}
              {viewMode === "week" && (
                <div className="h-[30px] flex">
                  {timelineRange.map((day, index) => (
                    <div 
                      key={`day-header-${index}`}
                      className={cn(
                        "flex items-center justify-center text-xs border-r",
                        isToday(day) && "bg-blue-500 text-white font-bold",
                        !isToday(day) && (day.getDay() === 0 || day.getDay() === 6) && "text-gray-400"
                      )}
                      style={{ width: `${dayWidth}px` }}
                    >
                      {format(day, "d")}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task Bars */}
            <div className="relative" style={{ width: `${timelineRange.length * dayWidth}px` }}>
              {/* Today Line */}
              {timelineRange.findIndex(day => isToday(day)) !== -1 && (
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-blue-500 z-10"
                  style={{ left: `${timelineRange.findIndex(day => isToday(day)) * dayWidth + dayWidth / 2}px` }}
                />
              )}

              {/* Grid Lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {timelineRange.map((day, index) => (
                  <div 
                    key={`grid-${index}`}
                    className={cn(
                      "h-full border-r border-gray-100 dark:border-slate-800",
                      (index + 1) % 7 === 0 && "border-gray-200 dark:border-slate-700"
                    )}
                    style={{ width: `${dayWidth}px` }}
                  />
                ))}
              </div>

              {/* Task Bars */}
              <TooltipProvider>
                {filteredTasks.map((task) => {
                  const barStyle = getDraggedBarStyle(task);
                  const isDragging = draggingTask?.id === task.id;
                  const isHovered = hoveredTask?.id === task.id;
                  
                  // Consistent with getTaskBarStyle logic
                  let taskStart: Date;
                  if (task.start_date) {
                    taskStart = startOfDay(parseISO(task.start_date));
                  } else if (task.due_date) {
                    taskStart = startOfDay(addDays(parseISO(task.due_date), -3));
                  } else if (task.created_at) {
                    taskStart = startOfDay(parseISO(task.created_at));
                  } else {
                    taskStart = startOfDay(new Date());
                  }
                  const taskEnd = task.due_date ? startOfDay(parseISO(task.due_date)) : addDays(taskStart, 3);
                  
                  const dates = isDragging ? getDraggedTaskDates(task) : {
                    start: taskStart,
                    end: taskEnd
                  };
                  const duration = differenceInDays(dates.end, dates.start) + 1;
                  
                  return (
                    <div 
                      key={`tl-bar-${task.id}`}
                      className="h-[40px] relative flex items-center"
                    >
                      <Tooltip open={isDragging || isHovered}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "absolute h-[24px] rounded-full flex items-center gap-1 cursor-move transition-shadow group",
                              getStatusColor(task.status),
                              isDragging && "shadow-xl ring-2 ring-blue-400 z-20",
                              !isDragging && "hover:shadow-lg"
                            )}
                            style={barStyle}
                            onMouseDown={(e) => handleDragStart(e, task, "move")}
                            onMouseEnter={() => setHoveredTask(task)}
                            onMouseLeave={() => setHoveredTask(null)}
                            onClick={(e) => {
                              if (!isDragging) {
                                e.stopPropagation();
                                setSelectedTask(task);
                              }
                            }}
                          >
                            {/* Left resize handle */}
                            <div 
                              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-l-full opacity-0 group-hover:opacity-100 hover:bg-black/20"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleDragStart(e, task, "resize-start");
                              }}
                            />
                            
                            {/* Task content */}
                            <div className="flex items-center gap-1 px-2 py-1 min-w-0">
                              {task.assignee && (
                                <Avatar className="h-4 w-4 shrink-0 border border-white">
                                  <AvatarFallback className="text-[8px] bg-white text-gray-700">
                                    {task.assignee.username[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {task.status === "DONE" && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            
                            {/* Right resize handle */}
                            <div 
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r-full opacity-0 group-hover:opacity-100 hover:bg-black/20"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleDragStart(e, task, "resize-end");
                              }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          className="bg-gray-900 text-white px-3 py-2 text-sm"
                        >
                          <p className="font-medium">
                            {format(dates.start, "PP", { locale: dateLocale })} - {format(dates.end, "PP", { locale: dateLocale })} ({duration} {t.common.days})
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </TooltipProvider>
              
              {/* Empty row for add task */}
              <div className="h-[40px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={projectId}
          projectName={projectName}
          members={members}
          ownerId={ownerId}
          open={true}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onUpdate={onTaskUpdate}
          onTaskUpdated={onTaskUpdated}
          onTaskDeleted={(taskId) => {
            setSelectedTask(null);
            onTaskDeleted?.(taskId);
          }}
        />
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        projectId={projectId}
        onSuccess={() => {
          setIsCreateOpen(false);
          onTaskUpdate();
        }}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
