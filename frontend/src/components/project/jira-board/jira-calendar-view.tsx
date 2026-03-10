"use client";

import { useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Equal, 
  Search,
  Filter,
  X,
  Check,
  Clock,
  Plus
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from "date-fns";
import { vi } from "date-fns/locale";
import { cn, getAvatarColor } from "@/lib/utils";
import { TaskDetailModal } from "../task-detail-modal";
import { CreateTaskDialog } from "../create-task-dialog";
import { taskService } from "@/services/task";
import { toast } from "sonner";

interface JiraCalendarViewProps {
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

type ViewType = "month" | "week";

export function JiraCalendarView({
  projectId,
  projectKey = "DATN",
  projectName,
  tasks,
  members,
  ownerId,
  onTaskUpdate,
  onTaskUpdated,
  onTaskDeleted,
}: JiraCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("month");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [createTaskDate, setCreateTaskDate] = useState<Date | null>(null);
  const { getDisplayName } = useCurrentUser();

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Must have due date
      if (!task.due_date) return false;

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

  // Get calendar days for the month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return filteredTasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = parseISO(task.due_date);
      return isSameDay(dueDate, day);
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300";
      case "INPR":
        return "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300";
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <ChevronUp className="h-3 w-3 text-red-500" />;
      case "LOW":
        return <ChevronDown className="h-3 w-3 text-blue-500" />;
      default:
        return <Equal className="h-3 w-3 text-yellow-500" />;
    }
  };

  // Navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Active filter count
  const activeFilterCount = statusFilter.length + priorityFilter.length + assigneeFilter.length;

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setPriorityFilter([]);
    setAssigneeFilter([]);
  };

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

  // Weekday headers
  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

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
              placeholder="Tìm trong lịch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Member avatars */}
          <div className="flex items-center gap-1">
            {members.slice(0, 4).map((member) => (
              <button
                key={`cal-member-${member.id}`}
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
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Xóa tất cả
                    </Button>
                  )}
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Trạng thái</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "TODO", label: "Việc cần làm", color: "bg-gray-100 text-gray-700" },
                      { value: "INPR", label: "Đang tiến hành", color: "bg-blue-100 text-blue-700" },
                      { value: "DONE", label: "Xong", color: "bg-green-100 text-green-700" },
                    ].map((status) => (
                      <Button
                        key={`cal-status-${status.value}`}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-7",
                          statusFilter.includes(status.value) && status.color
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
                        key={`cal-priority-${priority.value}`}
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
                        {priorityFilter.includes(priority.value) && <Check className="h-3 w-3 ml-1" />}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hôm nay
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: vi })}
            </span>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {viewType === "month" ? "Tháng" : "Tuần"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setViewType("month")}>
                Tháng
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewType("week")}>
                Tuần
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Tags */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilter.map(status => (
            <Badge key={`cal-tag-status-${status}`} variant="secondary" className="gap-1">
              {status === "TODO" ? "Việc cần làm" : status === "INPR" ? "Đang tiến hành" : "Xong"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter(statusFilter.filter(s => s !== status))} />
            </Badge>
          ))}
          {priorityFilter.map(priority => (
            <Badge key={`cal-tag-priority-${priority}`} variant="secondary" className="gap-1">
              {priority === "HIGH" ? "Cao" : priority === "MED" ? "Trung bình" : "Thấp"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setPriorityFilter(priorityFilter.filter(p => p !== priority))} />
            </Badge>
          ))}
          {assigneeFilter.map(id => {
            const member = members.find(m => m.id === id);
            return member ? (
              <Badge key={`cal-tag-assignee-${id}`} variant="secondary" className="gap-1">
                {getDisplayName(member.id, member.username)}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setAssigneeFilter(assigneeFilter.filter(a => a !== id))} />
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-950">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50 dark:bg-slate-900">
          {weekDays.map((day, index) => (
            <div 
              key={`weekday-${index}`}
              className="px-2 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400 border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={`day-${index}`}
                className={cn(
                  "min-h-[120px] border-b border-r last:border-r-0 p-1",
                  !isCurrentMonth && "bg-gray-50 dark:bg-slate-900/50",
                  "[&:nth-child(7n)]:border-r-0"
                )}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-1 group">
                  <span
                    className={cn(
                      "text-sm font-medium px-1.5 py-0.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800",
                      isCurrentDay && "bg-blue-500 text-white hover:bg-blue-600",
                      !isCurrentMonth && "text-gray-400 dark:text-gray-600"
                    )}
                    onClick={() => setCreateTaskDate(day)}
                    title="Click để tạo công việc mới"
                  >
                    {format(day, "d")}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setCreateTaskDate(day)}
                    title="Thêm công việc"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Tasks */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={`cal-task-${day.toISOString()}-${task.id}`}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "px-1.5 py-1 rounded border text-xs cursor-pointer transition-all hover:shadow-sm flex items-center gap-1 min-w-0",
                        getStatusColor(task.status)
                      )}
                    >
                      <Checkbox
                        checked={task.status === "DONE"}
                        onClick={(e) => handleToggleTaskStatus(task, e)}
                        className="h-3 w-3 shrink-0"
                      />
                      <span className="font-medium text-blue-600 dark:text-blue-400 shrink-0">
                        {projectKey}-{task.id}
                      </span>
                      <span className="truncate">{task.title}</span>
                      {getPriorityIcon(task.priority)}
                      {task.assignee && (
                        <Avatar className="h-4 w-4 shrink-0 ml-auto">
                          <AvatarFallback className={cn("text-[8px] text-white", getAvatarColor(task.assignee.id))}>
                            {task.assignee.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayTasks.length - 3} công việc khác
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks without due date notice */}
      {tasks.filter(t => !t.due_date).length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-slate-900 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Có {tasks.filter(t => !t.due_date).length} công việc chưa có ngày đến hạn
          </span>
        </div>
      )}

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
          setCreateTaskDate(null);
          onTaskUpdate();
        }}
        open={!!createTaskDate}
        onOpenChange={(open) => !open && setCreateTaskDate(null)}
        defaultDueDate={createTaskDate || undefined}
      />
    </div>
  );
}
