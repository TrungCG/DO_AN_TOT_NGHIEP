"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Task, TaskStatus } from "@/types/task";
import { User } from "@/types/auth";
import { taskService } from "@/services/task";
import { KanbanColumn } from "./kanban-column";
import { DraggableTaskCard } from "./draggable-task-card";
import { TaskDetailModal } from "./task-detail-modal";

interface KanbanBoardProps {
  projectId: number;
  initialTasks: Task[];
  onTaskUpdate: () => void;
  members: User[];
  ownerId?: number;
  selectedTask?: Task | null;
  onSelectTask?: (task: Task | null) => void;
  searchQuery?: string;
}

export function KanbanBoard({
  projectId,
  initialTasks,
  onTaskUpdate,
  members,
  ownerId,
  selectedTask = null,
  onSelectTask,
  searchQuery = "",
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [internalSelectedTask, setInternalSelectedTask] = useState<Task | null>(null);

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

  useEffect(() => {
    console.log("🔍 KanbanBoard - ownerId:", ownerId, typeof ownerId);
  }, [ownerId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = parseInt(active.id as string);
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t,
      );
      setTasks(updatedTasks);

      try {
        await taskService.update(taskId, { status: newStatus });
        toast.success("Cập nhật trạng thái thành công");
        onTaskUpdate();
      } catch (error) {
        toast.error("Không thể cập nhật trạng thái");
        onTaskUpdate();
      }
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    let filtered = tasks.filter((task) => task.status === status);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.id.toString().includes(query)
      );
    }
    
    // Sắp xếp theo: Quá hạn → Độ ưu tiên (HIGH → MED → LOW)
    return filtered.sort((a, b) => {
      const now = new Date();
      const isPastA = a.due_date ? new Date(a.due_date) < now && status !== "DONE" : false;
      const isPastB = b.due_date ? new Date(b.due_date) < now && status !== "DONE" : false;
      
      // Quá hạn lên trên
      if (isPastA && !isPastB) return -1;
      if (!isPastA && isPastB) return 1;
      
      // Sắp xếp theo độ ưu tiên
      const priorityOrder = { HIGH: 0, MED: 1, LOW: 2 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
    });
  };

  return (
    <>
      {/* Board Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Board
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Drag các task để thay đổi trạng thái
        </p>
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
          <KanbanColumn
            id="TODO"
            title="TO DO"
            count={getTasksByStatus("TODO").length}
            icon={<AlertCircle className="h-5 w-5" />}
            colorClass="bg-gray-100"
          >
            {getTasksByStatus("TODO").map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onClick={() => handleSelectTask(task)}
              />
            ))}
          </KanbanColumn>

          <KanbanColumn
            id="INPR"
            title="IN PROGRESS"
            count={getTasksByStatus("INPR").length}
            icon={<Clock className="h-5 w-5" />}
            colorClass="bg-blue-50"
          >
            {getTasksByStatus("INPR").map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onClick={() => handleSelectTask(task)}
              />
            ))}
          </KanbanColumn>

          <KanbanColumn
            id="DONE"
            title="DONE"
            count={getTasksByStatus("DONE").length}
            icon={<CheckCircle2 className="h-5 w-5" />}
            colorClass="bg-green-50"
          >
            {getTasksByStatus("DONE").map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onClick={() => handleSelectTask(task)}
              />
            ))}
          </KanbanColumn>
        </div>
      </DndContext>

      {/* Modal */}
      {currentSelectedTask && (
        <TaskDetailModal
          task={currentSelectedTask}
          projectId={projectId}
          open={!!currentSelectedTask}
          onOpenChange={(open) => !open && handleCloseTask()}
          onUpdate={onTaskUpdate}
          members={members}
          ownerId={ownerId}
        />
      )}
    </>
  );
}
