"use client";

import { useState, useEffect } from "react";
import { Task } from "@/types/task";
import { User } from "@/types/auth";
import { Comment, ActivityLog } from "@/types/extra";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { 
  ChevronUp, 
  ChevronDown, 
  Equal, 
  MoreHorizontal,
  Plus,
  ArrowUpDown,
  UserX,
  RefreshCw,
  LayoutList,
  Columns2,
  CalendarIcon,
  Check,
  Settings2,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Search,
  Filter,
  X
} from "lucide-react";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { cn, getAvatarColor } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { TaskDetailModal } from "../task-detail-modal";
import { taskService } from "@/services/task";
import { commentService, activityService } from "@/services/extra";
import { toast } from "sonner";

interface JiraListViewProps {
  projectId: number;
  projectKey?: string;
  projectName?: string;
  tasks: Task[];
  members: User[];
  ownerId?: number;
  onTaskUpdate: () => void | Promise<void>;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: number) => void;
  onCreateTask?: () => void;
}

type SortField = "id" | "title" | "priority" | "status" | "created_at" | "updated_at" | "due_date";
type SortOrder = "asc" | "desc";
type ViewMode = "table" | "split";

export function JiraListView({
  projectId,
  projectKey = "DATN",
  projectName,
  tasks,
  members,
  ownerId,
  onTaskUpdate,
  onTaskUpdated,
  onTaskDeleted,
  onCreateTask,
}: JiraListViewProps) {
  const { getDisplayName } = useCurrentUser();
  const { t, locale, getStatusLabel, getPriorityLabel } = useI18n();
  const dateLocale = locale === 'vi' ? vi : enUS;
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Split view state
  const [activityTab, setActivityTab] = useState<"all" | "comments" | "history">("comments");
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  // Fetch comments when selected task changes
  useEffect(() => {
    if (selectedTask && viewMode === "split") {
      fetchComments(selectedTask.id);
      fetchActivities(selectedTask.id);
    }
  }, [selectedTask?.id, viewMode]);

  const fetchComments = async (taskId: number) => {
    try {
      setLoadingComments(true);
      const data = await commentService.getAll(taskId);
      setComments(data);
    } catch {
      console.error("Could not load comments");
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchActivities = async (taskId: number) => {
    try {
      const data = await activityService.getTaskActivity(taskId);
      setActivities(data);
    } catch {
      console.error("Could not load activities");
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return;
    try {
      await commentService.create(selectedTask.id, newComment.trim());
      setNewComment("");
      fetchComments(selectedTask.id);
      toast.success(t.listView.commentAdded);
    } catch {
      toast.error(t.listView.commentAddError);
    }
  };

  const handleUpdateDescription = async () => {
    if (!selectedTask) return;
    try {
      await taskService.update(selectedTask.id, { description: editedDescription });
      setIsEditingDescription(false);
      toast.success(t.listView.descriptionUpdated);
      onTaskUpdate();
    } catch {
      toast.error(t.listView.descriptionUpdateError);
    }
  };

  const formatActivityDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "PP p", { locale: dateLocale });
    } catch {
      return dateStr;
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesId = `${projectKey}-${task.id}`.toLowerCase().includes(query);
      const matchesDescription = task.description?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesId && !matchesDescription) return false;
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

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case "id":
        comparison = a.id - b.id;
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "priority":
        const priorityOrder = { HIGH: 0, MED: 1, LOW: 2 };
        comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
                    (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
        break;
      case "status":
        const statusOrder = { TODO: 0, INPR: 1, DONE: 2 };
        comparison = (statusOrder[a.status as keyof typeof statusOrder] || 3) - 
                    (statusOrder[b.status as keyof typeof statusOrder] || 3);
        break;
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "updated_at":
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      case "due_date":
        if (!a.due_date && !b.due_date) comparison = 0;
        else if (!a.due_date) comparison = 1;
        else if (!b.due_date) comparison = -1;
        else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(t => t.id)));
    }
  };

  const toggleSelectTask = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const getPriorityDisplay = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return (
          <span className="flex items-center gap-1 text-red-600">
            <ChevronUp className="h-4 w-4" />
            {t.taskPriority.high}
          </span>
        );
      case "MED":
        return (
          <span className="flex items-center gap-1 text-orange-500">
            <Equal className="h-4 w-4" />
            {t.taskPriority.medium}
          </span>
        );
      case "LOW":
        return (
          <span className="flex items-center gap-1 text-green-600">
            <ChevronDown className="h-4 w-4" />
            {t.taskPriority.low}
          </span>
        );
      default:
        return priority;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "TODO":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs font-medium">
            {t.taskStatus.todo}
          </Badge>
        );
      case "INPR":
        return (
          <Badge className="bg-blue-500 text-white text-xs font-medium hover:bg-blue-600">
            {t.taskStatus.inProgress}
          </Badge>
        );
      case "DONE":
        return (
          <Badge className="bg-green-500 text-white text-xs font-medium hover:bg-green-600">
            {t.taskStatus.done}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t.listView.noDate;
    try {
      return format(new Date(dateStr), "PP, p", { locale: dateLocale });
    } catch {
      return t.listView.noDate;
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await taskService.update(task.id, { status: newStatus as "TODO" | "INPR" | "DONE" });
      toast.success(t.listView.statusUpdated);
      onTaskUpdate();
    } catch {
      toast.error(t.listView.statusUpdateError);
    }
  };

  const handleAssigneeChange = async (task: Task, assigneeId: number | null) => {
    try {
      await taskService.update(task.id, { assignee_id: assigneeId });
      toast.success(t.listView.assigneeUpdated);
      onTaskUpdate();
    } catch {
      toast.error(t.listView.assigneeUpdateError);
    }
  };

  const handlePriorityChange = async (task: Task, newPriority: string) => {
    try {
      await taskService.update(task.id, { priority: newPriority as "HIGH" | "MED" | "LOW" });
      toast.success(t.listView.priorityUpdated);
      onTaskUpdate();
    } catch {
      toast.error(t.listView.priorityUpdateError);
    }
  };

  const handleDueDateChange = async (task: Task, newDate: Date | undefined) => {
    try {
      const dateStr = newDate ? newDate.toISOString().split('T')[0] : null;
      await taskService.update(task.id, { due_date: dateStr });
      toast.success(t.listView.dueDateUpdated);
      onTaskUpdate();
    } catch {
      toast.error(t.listView.dueDateUpdateError);
    }
  };

  // Helper function to get reporter/creator from created_by ID
  const getCreator = (createdById: number) => {
    return members.find(m => m.id === createdById);
  };

  // Render sortable header
  const renderSortableHeader = (field: SortField, label: string) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortOrder === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  // Calculate active filter count
  const activeFilterCount = statusFilter.length + priorityFilter.length + assigneeFilter.length;

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setPriorityFilter([]);
    setAssigneeFilter([]);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t.listView.searchPlaceholder}
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

        {/* Member Avatars Filter */}
        <div className="flex items-center gap-1">
          {members.slice(0, 5).map((member) => (
            <button
              key={`filter-member-${member.id}`}
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
                <AvatarFallback className={cn("text-xs text-white", getAvatarColor(member.id))}>
                  {member.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          ))}
        </div>

        {/* Filter Button */}
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button 
              variant={activeFilterCount > 0 ? "default" : "outline"} 
              size="sm" 
              className="h-9 gap-2"
            >
              <Filter className="h-4 w-4" />
              {t.listView.filter}
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
                <h4 className="font-medium">{t.listView.filters}</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    {t.listView.clearAll}
                  </Button>
                )}
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">{t.listView.statusLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "TODO", label: getStatusLabel("TODO"), color: "bg-gray-100 text-gray-700" },
                    { value: "INPR", label: getStatusLabel("INPR"), color: "bg-blue-100 text-blue-700" },
                    { value: "DONE", label: getStatusLabel("DONE"), color: "bg-green-100 text-green-700" },
                  ].map((status) => (
                    <Button
                      key={status.value}
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
                <label className="text-sm font-medium mb-2 block">{t.listView.priorityLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "HIGH", label: getPriorityLabel("HIGH"), icon: <ChevronUp className="h-3 w-3 text-red-500" /> },
                    { value: "MED", label: getPriorityLabel("MED"), icon: <Equal className="h-3 w-3 text-yellow-500" /> },
                    { value: "LOW", label: getPriorityLabel("LOW"), icon: <ChevronDown className="h-3 w-3 text-blue-500" /> },
                  ].map((priority) => (
                    <Button
                      key={priority.value}
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

              {/* Assignee Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">{t.listView.assigneeLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <Button
                      key={`filter-assignee-${member.id}`}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 gap-1",
                        assigneeFilter.includes(member.id) && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      )}
                      onClick={() => {
                        if (assigneeFilter.includes(member.id)) {
                          setAssigneeFilter(assigneeFilter.filter(id => id !== member.id));
                        } else {
                          setAssigneeFilter([...assigneeFilter, member.id]);
                        }
                      }}
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[10px]">
                          {member.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {getDisplayName(member.id, member.username)}
                      {assigneeFilter.includes(member.id) && <Check className="h-3 w-3" />}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {statusFilter.map(status => (
              <Badge key={`tag-status-${status}`} variant="secondary" className="gap-1">
                {getStatusLabel(status)}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter(statusFilter.filter(s => s !== status))} />
              </Badge>
            ))}
            {priorityFilter.map(priority => (
              <Badge key={`tag-priority-${priority}`} variant="secondary" className="gap-1">
                {getPriorityLabel(priority)}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setPriorityFilter(priorityFilter.filter(p => p !== priority))} />
              </Badge>
            ))}
            {assigneeFilter.map(id => {
              const member = members.find(m => m.id === id);
              return member ? (
                <Badge key={`tag-assignee-${id}`} variant="secondary" className="gap-1">
                  {getDisplayName(member.id, member.username)}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setAssigneeFilter(assigneeFilter.filter(a => a !== id))} />
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {filteredTasks.length} {t.listView.countOf} {tasks.length}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2"
            disabled={isRefreshing}
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await onTaskUpdate();
                toast.success(t.listView.refreshed);
              } catch (error) {
                toast.error(t.listView.refreshError);
              } finally {
                setIsRefreshing(false);
              }
            }}
            title={t.listView.refresh}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
        
        <div className="flex items-center gap-1 border rounded-md">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-7 px-2 rounded-r-none",
              viewMode === "table" && "bg-gray-100 dark:bg-slate-800"
            )}
            onClick={() => setViewMode("table")}
            title={t.listView.tableView}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-7 px-2 rounded-l-none",
              viewMode === "split" && "bg-gray-100 dark:bg-slate-800"
            )}
            onClick={() => setViewMode("split")}
            title={t.listView.splitView}
          >
            <Columns2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-slate-900">
              <TableHead className="w-10">
                <Checkbox 
                  checked={selectedTasks.size === tasks.length && tasks.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              {renderSortableHeader("title", t.listView.work)}
              {projectId !== -1 && <TableHead>{t.listView.assignee}</TableHead>}
              {projectId !== -1 && <TableHead>{t.listView.reporter}</TableHead>}
              {renderSortableHeader("priority", t.common.priority)}
              {renderSortableHeader("status", t.common.status)}
              {renderSortableHeader("created_at", t.listView.created)}
              {renderSortableHeader("updated_at", t.listView.updated)}
              {renderSortableHeader("due_date", t.common.dueDate)}
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => (
              <TableRow 
                key={`list-task-${task.id}`}
                className={cn(
                  "hover:bg-gray-50 dark:hover:bg-slate-800/50",
                  selectedTasks.has(task.id) && "bg-blue-50 dark:bg-blue-900/20"
                )}
              >
                <TableCell>
                  <Checkbox 
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={() => toggleSelectTask(task.id)}
                  />
                </TableCell>
                <TableCell>
                  <button 
                    className="flex items-center gap-2 text-left hover:underline"
                    onClick={() => setSelectedTask(task)}
                  >
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {projectKey}-{task.id}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {task.title}
                    </span>
                  </button>
                </TableCell>
                {projectId !== -1 && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className={cn("text-xs text-white", getAvatarColor(task.assignee.id))}>
                                  {task.assignee.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{getDisplayName(task.assignee.id, task.assignee.username)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                              <UserX className="h-5 w-5" />
                              <span className="text-sm">{t.common.unassigned}</span>
                            </div>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={() => handleAssigneeChange(task, null)}>
                          <UserX className="h-4 w-4 mr-2 text-gray-400" />
                          {t.common.unassigned}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {members.map((member) => (
                          <DropdownMenuItem 
                            key={`assign-${task.id}-${member.id}`} 
                            onClick={() => handleAssigneeChange(task, member.id)}
                          >
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarFallback className={cn("text-xs text-white", getAvatarColor(member.id))}>
                                {member.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {getDisplayName(member.id, member.username)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
                {projectId !== -1 && (
                  <TableCell>
                    {(() => {
                      const creator = getCreator(task.created_by);
                      return creator ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className={cn("text-xs text-white", getAvatarColor(creator.id))}>
                              {creator.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{getDisplayName(creator.id, creator.username)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      );
                    })()}
                  </TableCell>
                )}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1">
                        {getPriorityDisplay(task.priority)}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handlePriorityChange(task, "HIGH")}>
                        <ChevronUp className="h-4 w-4 mr-2 text-red-500" />
                        {t.taskPriority.high}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePriorityChange(task, "MED")}>
                        <Equal className="h-4 w-4 mr-2 text-orange-500" />
                        {t.taskPriority.medium}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePriorityChange(task, "LOW")}>
                        <ChevronDown className="h-4 w-4 mr-2 text-green-500" />
                        {t.taskPriority.low}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="cursor-pointer">
                        {getStatusBadge(task.status)}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleStatusChange(task, "TODO")}>
                        {t.taskStatus.todo}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(task, "INPR")}>
                        {t.taskStatus.inProgress}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(task, "DONE")}>
                        {t.taskStatus.done}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {formatDate(task.created_at)}
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {formatDate(task.updated_at)}
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {task.due_date ? formatDate(task.due_date) : t.listView.noDate}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={task.due_date ? new Date(task.due_date) : undefined}
                        onSelect={(date) => handleDueDateChange(task, date)}
                        disabled={{ before: new Date() }}
                        initialFocus
                      />
                      {task.due_date && (
                        <div className="p-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-red-500 hover:text-red-600"
                            onClick={() => handleDueDateChange(task, undefined)}
                          >
                            {t.listView.clearDueDate}
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedTask(task)}>
                        {t.listView.viewDetails}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            
            {/* Create Row */}
            <TableRow className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
              <TableCell colSpan={10}>
                <button 
                  onClick={onCreateTask}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  {t.common.create}
                </button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      )}

      {/* Split View */}
      {viewMode === "split" && (
        <div className="flex gap-0 border rounded-lg overflow-hidden h-[calc(100vh-280px)]">
          {/* Left Panel - Task List */}
          <div className="w-[380px] border-r bg-gray-50 dark:bg-slate-900 flex flex-col">
            {/* Sort Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b bg-white dark:bg-slate-800">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-sm font-medium">
                    {sortField === "created_at" ? t.listView.created : sortField === "updated_at" ? t.listView.updated : t.listView.created}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleSort("created_at")}>
                    {t.listView.created}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("updated_at")}>
                    {t.listView.updated}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("priority")}>
                    {t.common.priority}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  disabled={isRefreshing}
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      await onTaskUpdate();
                      toast.success(t.listView.refreshed);
                    } catch (error) {
                      toast.error(t.listView.refreshError);
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  title={t.listView.refresh}
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
              </div>
            </div>

            {/* Task Cards */}
            <div className="flex-1 overflow-y-auto">
              {sortedTasks.map((task, index) => (
                <div
                  key={`split-task-${task.id}`}
                  className={cn(
                    "px-3 py-2 border-b cursor-pointer transition-colors",
                    selectedTask?.id === task.id 
                      ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-500" 
                      : "hover:bg-white dark:hover:bg-slate-800"
                  )}
                  onClick={() => setSelectedTask(task)}
                >
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0",
                      task.status === "DONE" 
                        ? "bg-blue-500 border-blue-500" 
                        : "border-gray-300 dark:border-gray-600"
                    )}>
                      {task.status === "DONE" && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-xs text-gray-500">{projectKey}-{task.id}</span>
                    <span className="flex-1" />
                    {task.assignee && (
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className={cn("text-xs text-white", getAvatarColor(task.assignee.id))}>
                          {task.assignee.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Count */}
              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                {tasks.length} {t.listView.countOf} {tasks.length}
              </div>
            </div>
          </div>

          {/* Right Panel - Task Details */}
          <div className="flex-1 flex">
            {selectedTask ? (
              <>
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Task Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn(
                      "w-5 h-5 rounded-sm border flex items-center justify-center",
                      selectedTask.status === "DONE" 
                        ? "bg-blue-500 border-blue-500" 
                        : "border-gray-300"
                    )}>
                      {selectedTask.status === "DONE" && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-500">{projectKey}-{selectedTask.id}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                      const currentIndex = sortedTasks.findIndex(t => t.id === selectedTask.id);
                      if (currentIndex > 0) setSelectedTask(sortedTasks[currentIndex - 1]);
                    }}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                      const currentIndex = sortedTasks.findIndex(t => t.id === selectedTask.id);
                      if (currentIndex < sortedTasks.length - 1) setSelectedTask(sortedTasks[currentIndex + 1]);
                    }}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    {selectedTask.title}
                  </h1>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.common.description}</h3>
                    {isEditingDescription ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          placeholder={t.listView.addDescription}
                          className="min-h-[100px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateDescription}>{t.common.save}</Button>
                          <Button size="sm" variant="outline" onClick={() => setIsEditingDescription(false)}>{t.common.cancel}</Button>
                        </div>
                      </div>
                    ) : (
                      <p 
                        className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 rounded p-2 -m-2"
                        onClick={() => {
                          setEditedDescription(selectedTask.description || "");
                          setIsEditingDescription(true);
                        }}
                      >
                        {selectedTask.description || t.listView.addDescription}
                      </p>
                    )}
                  </div>

                  {/* Activity Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t.common.activity}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Button 
                        variant={activityTab === "all" ? "default" : "outline"} 
                        size="sm" 
                        className={cn("h-7", activityTab === "all" && "bg-blue-500 hover:bg-blue-600")}
                        onClick={() => setActivityTab("all")}
                      >
                        {t.common.all}
                      </Button>
                      <Button 
                        variant={activityTab === "comments" ? "default" : "outline"} 
                        size="sm" 
                        className={cn("h-7", activityTab === "comments" && "bg-blue-500 hover:bg-blue-600")}
                        onClick={() => setActivityTab("comments")}
                      >
                        {t.common.comments}
                      </Button>
                      <Button 
                        variant={activityTab === "history" ? "default" : "outline"} 
                        size="sm" 
                        className={cn("h-7", activityTab === "history" && "bg-blue-500 hover:bg-blue-600")}
                        onClick={() => setActivityTab("history")}
                      >
                        {t.common.history}
                      </Button>
                    </div>

                    {/* Comment Input */}
                    {(activityTab === "all" || activityTab === "comments") && (
                      <div className="flex items-start gap-2 mb-4">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={cn("text-white text-sm", selectedTask.assignee ? getAvatarColor(selectedTask.assignee.id) : "bg-gray-500")}>
                            {selectedTask.assignee?.username.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t.listView.addComment}
                            className="min-h-[60px]"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.ctrlKey) {
                                handleAddComment();
                              }
                            }}
                          />
                          {newComment.trim() && (
                            <div className="mt-2">
                              <Button size="sm" onClick={handleAddComment}>{t.common.send}</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Comments List */}
                    {(activityTab === "all" || activityTab === "comments") && (
                      <div className="space-y-3">
                        {loadingComments ? (
                          <p className="text-sm text-gray-400">Loading...</p>
                        ) : comments.length === 0 ? (
                          <p className="text-sm text-gray-400">Chưa có bình luận nào</p>
                        ) : (
                          comments.map((comment) => (
                            <div key={`comment-${comment.id}`} className="flex items-start gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={cn("text-white text-sm", getAvatarColor(comment.author.id))}>
                                  {comment.author.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{getDisplayName(comment.author.id, comment.author.username)}</span>
                                  <span className="text-xs text-gray-400">{formatActivityDate(comment.created_at)}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{comment.body}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* History/Activity List */}
                    {(activityTab === "all" || activityTab === "history") && (
                      <div className="space-y-2 mt-4">
                        {activityTab === "all" && activities.length > 0 && (
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mt-4 mb-2">History</h4>
                        )}
                        {activities.length === 0 && activityTab === "history" ? (
                          <p className="text-sm text-gray-400">Chưa có lịch sử</p>
                        ) : (
                          activities.map((activity) => (
                            <div key={`activity-${activity.id}`} className="text-sm text-gray-600 dark:text-gray-400 py-1">
                              <span className="font-medium">{getDisplayName(activity.actor.id, activity.actor.username)}</span>
                              {" "}{activity.action_description}{" "}
                              <span className="text-xs text-gray-400">{formatActivityDate(activity.timestamp)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Sidebar */}
                <div className="w-[280px] border-l bg-gray-50 dark:bg-slate-900 p-4 overflow-y-auto">
                  {/* Status */}
                  <div className="mb-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          className={cn(
                            "h-8 font-medium",
                            selectedTask.status === "TODO" && "bg-gray-200 text-gray-700 hover:bg-gray-300",
                            selectedTask.status === "INPR" && "bg-blue-500 text-white hover:bg-blue-600",
                            selectedTask.status === "DONE" && "bg-green-500 text-white hover:bg-green-600"
                          )}
                        >
                          {selectedTask.status === "TODO" ? t.taskStatus.todo : selectedTask.status === "INPR" ? t.taskStatus.inProgress : t.taskStatus.done}
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleStatusChange(selectedTask, "TODO")}>{t.taskStatus.todo}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(selectedTask, "INPR")}>{t.taskStatus.inProgress}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(selectedTask, "DONE")}>{t.taskStatus.done}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h4 className="text-xs font-semibold text-gray-500 mb-3">Chi tiết</h4>

                  {/* Assignee */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 block mb-1">{t.listView.assignee}</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded px-2 py-1 -mx-2 w-full">
                          {selectedTask.assignee ? (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className={cn("text-white text-xs", getAvatarColor(selectedTask.assignee.id))}>
                                  {selectedTask.assignee.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{getDisplayName(selectedTask.assignee.id, selectedTask.assignee.username)}</span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-5 w-5 text-gray-400" />
                              <span className="text-sm text-gray-400">{t.common.unassigned}</span>
                            </>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        <DropdownMenuItem onClick={() => handleAssigneeChange(selectedTask, null)}>
                          <UserX className="h-4 w-4 mr-2 text-gray-400" />
                          {t.common.unassigned}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {members.map((member) => (
                          <DropdownMenuItem 
                            key={`split-assign-${member.id}`}
                            onClick={() => handleAssigneeChange(selectedTask, member.id)}
                          >
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarFallback className={cn("text-xs text-white", getAvatarColor(member.id))}>
                                {member.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {getDisplayName(member.id, member.username)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Reporter */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 block mb-1">{t.listView.reporter}</label>
                    <div className="flex items-center gap-2 px-2 py-1 -mx-2">
                      {(() => {
                        const creator = getCreator(selectedTask.created_by);
                        return creator ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className={cn("text-white text-xs", getAvatarColor(creator.id))}>
                                {creator.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{getDisplayName(creator.id, creator.username)}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 block mb-1">{t.common.dueDate}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded px-2 py-1 -mx-2 text-sm">
                          {selectedTask.due_date ? formatDate(selectedTask.due_date) : t.listView.noDate}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedTask.due_date ? new Date(selectedTask.due_date) : undefined}
                          onSelect={(date) => handleDueDateChange(selectedTask, date)}
                          disabled={{ before: new Date() }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Priority */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 block mb-1">{t.common.priority}</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded px-2 py-1 -mx-2">
                          {getPriorityDisplay(selectedTask.priority)}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handlePriorityChange(selectedTask, "HIGH")}>
                          <ChevronUp className="h-4 w-4 mr-2 text-red-500" />
                          {t.taskPriority.high}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePriorityChange(selectedTask, "MED")}>
                          <Equal className="h-4 w-4 mr-2 text-orange-500" />
                          {t.taskPriority.medium}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePriorityChange(selectedTask, "LOW")}>
                          <ChevronDown className="h-4 w-4 mr-2 text-green-500" />
                          {t.taskPriority.low}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chọn một công việc để xem chi tiết</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Detail Modal - Only for table view */}
      {viewMode === "table" && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={projectId}
          projectName={projectName}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onUpdate={onTaskUpdate}
          onTaskUpdated={onTaskUpdated}
          onTaskDeleted={(taskId) => {
            setSelectedTask(null);
            onTaskDeleted?.(taskId);
          }}
          members={members}
          ownerId={ownerId}
        />
      )}
    </div>
  );
}
