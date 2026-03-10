"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { toast } from "sonner";

import { Task, TaskStatus } from "@/types/task";
import { User } from "@/types/auth";
import { taskService } from "@/services/task";
import { useI18n } from "@/lib/i18n";
import { JiraColumn } from "./jira-column";
import { JiraMemberColumn } from "./jira-member-column";
import { JiraTaskCard } from "./jira-task-card";
import { BoardToolbar, FilterState } from "./board-toolbar";
import { TaskDetailModal } from "../task-detail-modal";

interface JiraBoardProps {
  projectId: number;
  projectKey?: string;
  projectName?: string;
  initialTasks: Task[];
  onTaskUpdate: () => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: number) => void;
  members: User[];
  ownerId?: number;
  selectedTask?: Task | null;
  onSelectTask?: (task: Task | null) => void;
  onCreateTask?: () => void;
}

export function JiraBoard({
  projectId,
  projectKey = "DATN",
  projectName,
  initialTasks,
  onTaskUpdate,
  onTaskUpdated,
  onTaskDeleted,
  members,
  ownerId,
  selectedTask = null,
  onSelectTask,
  onCreateTask,
}: JiraBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [internalSelectedTask, setInternalSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<"status" | "member">("status");
  const [filters, setFilters] = useState<FilterState>({ priority: null, status: null });
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { t, getStatusLabel } = useI18n();

  // Get current user ID from JWT token
  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.user_id);
      }
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }, []);

  // Use external selectedTask if provided, otherwise use internal state
  const currentSelectedTask = selectedTask !== undefined ? selectedTask : internalSelectedTask;

  const handleSelectTask = (task: Task) => {
    if (onSelectTask) {
      onSelectTask(task);
    } else {
      setInternalSelectedTask(task);
    }
  };

  const handleCloseTask = () => {
    if (onSelectTask) {
      onSelectTask(null);
    } else {
      setInternalSelectedTask(null);
    }
  };

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = parseInt(active.id as string);
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      );
      setTasks(updatedTasks);

      try {
        await taskService.update(taskId, { status: newStatus });
        toast.success("Cập nhật trạng thái thành công");
        onTaskUpdate();
      } catch {
        toast.error("Không thể cập nhật trạng thái");
        onTaskUpdate();
      }
    }
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.id.toString().includes(query)
      );
    }

    // Filter by selected member (avatar click)
    if (selectedMemberId) {
      filtered = filtered.filter(
        (task) => task.assignee?.id === selectedMemberId
      );
    }

    // Filter by priority
    if (filters.priority) {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    return filtered;
  };

  const getTasksByStatus = (status: TaskStatus) => {
    const filtered = getFilteredTasks().filter((task) => task.status === status);

    // Sort: Overdue → Priority (HIGH → MED → LOW)
    return filtered.sort((a, b) => {
      const now = new Date();
      const isPastA = a.due_date ? new Date(a.due_date) < now && status !== "DONE" : false;
      const isPastB = b.due_date ? new Date(b.due_date) < now && status !== "DONE" : false;

      if (isPastA && !isPastB) return -1;
      if (!isPastA && isPastB) return 1;

      const priorityOrder = { HIGH: 0, MED: 1, LOW: 2 };
      return (
        (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] || 3)
      );
    });
  };

  const todoTasks = getTasksByStatus("TODO");
  const inProgressTasks = getTasksByStatus("INPR");
  const doneTasks = getTasksByStatus("DONE");

  // Group tasks by member for member view
  const getTasksByMember = (memberId: number | null) => {
    const filtered = getFilteredTasks().filter((task) => {
      if (memberId === null) {
        return !task.assignee;
      }
      return task.assignee?.id === memberId;
    });

    // Sort: Overdue → Priority (HIGH → MED → LOW)
    return filtered.sort((a, b) => {
      const now = new Date();
      const isPastA = a.due_date ? new Date(a.due_date) < now && a.status !== "DONE" : false;
      const isPastB = b.due_date ? new Date(b.due_date) < now && b.status !== "DONE" : false;

      if (isPastA && !isPastB) return -1;
      if (!isPastA && isPastB) return 1;

      const priorityOrder = { HIGH: 0, MED: 1, LOW: 2 };
      return (
        (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] || 3)
      );
    });
  };

  // Check if there are unassigned tasks
  const unassignedTasks = getTasksByMember(null);

  return (
    <div className="h-full">
      {/* Board Toolbar */}
      <BoardToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        members={members}
        selectedMemberId={selectedMemberId}
        onMemberSelect={setSelectedMemberId}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        filters={filters}
        onFiltersChange={setFilters}
        isPersonal={projectId === -1}
      />

      {/* Kanban Board - By Status */}
      {groupBy === "status" && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-2 overflow-x-auto pb-4">
            <JiraColumn
              id="TODO"
              title={getStatusLabel("TODO")}
              count={todoTasks.length}
              onCreateTask={onCreateTask}
            >
              {todoTasks.map((task) => (
                <JiraTaskCard
                  key={`status-todo-${task.id}`}
                  task={task}
                  projectKey={projectKey}
                  onClick={() => handleSelectTask(task)}
                />
              ))}
            </JiraColumn>

            <JiraColumn
              id="INPR"
              title={getStatusLabel("INPR")}
              count={inProgressTasks.length}
            >
              {inProgressTasks.map((task) => (
                <JiraTaskCard
                  key={`status-inpr-${task.id}`}
                  task={task}
                  projectKey={projectKey}
                  onClick={() => handleSelectTask(task)}
                />
              ))}
            </JiraColumn>

            <JiraColumn
              id="DONE"
              title={getStatusLabel("DONE")}
              count={doneTasks.length}
              showSettings
            >
              {doneTasks.map((task) => (
                <JiraTaskCard
                  key={`status-done-${task.id}`}
                  task={task}
                  projectKey={projectKey}
                  onClick={() => handleSelectTask(task)}
                />
              ))}
            </JiraColumn>
          </div>
        </DndContext>
      )}

      {/* Kanban Board - By Member */}
      {groupBy === "member" && (
        <div className="flex gap-2 overflow-x-auto pb-4">
          {members.map((member) => {
            const memberTasks = getTasksByMember(member.id);
            return (
              <JiraMemberColumn
                key={`member-col-${member.id}`}
                member={member}
                tasks={memberTasks}
                projectKey={projectKey}
                onTaskClick={handleSelectTask}
                currentUserId={currentUserId ?? undefined}
              />
            );
          })}
          
          {/* Unassigned column */}
          {unassignedTasks.length > 0 && (
            <JiraMemberColumn
              member={null}
              tasks={unassignedTasks}
              projectKey={projectKey}
              onTaskClick={handleSelectTask}
              currentUserId={currentUserId ?? undefined}
            />
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      {currentSelectedTask && (
        <TaskDetailModal
          task={currentSelectedTask}
          projectId={projectId}
          projectName={projectName}
          open={!!currentSelectedTask}
          onOpenChange={(open) => !open && handleCloseTask()}
          onUpdate={onTaskUpdate}
          onTaskUpdated={(updatedTask) => {
            // Optimistic update - update local state immediately
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            // Also notify parent to sync state
            onTaskUpdated?.(updatedTask);
          }}
          onTaskDeleted={(taskId) => {
            // Optimistic delete - remove from local state immediately
            setTasks(prev => prev.filter(t => t.id !== taskId));
            handleCloseTask();
            // Also notify parent to sync state
            onTaskDeleted?.(taskId);
          }}
          members={members}
          ownerId={ownerId}
        />
      )}
    </div>
  );
}
