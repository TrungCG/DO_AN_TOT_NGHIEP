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
}

export function KanbanBoard({
  projectId,
  initialTasks,
  onTaskUpdate,
  members,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

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
    return tasks.filter((task) => task.status === status);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KanbanColumn
          id="TODO"
          title="TO DO"
          count={getTasksByStatus("TODO").length}
          icon={<AlertCircle className="mr-2 h-5 w-5 text-gray-500" />}
          colorClass="bg-gray-100"
        >
          {getTasksByStatus("TODO").map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          id="INPR"
          title="IN PROGRESS"
          count={getTasksByStatus("INPR").length}
          icon={<Clock className="mr-2 h-5 w-5 text-blue-500" />}
          colorClass="bg-blue-50"
        >
          {getTasksByStatus("INPR").map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          id="DONE"
          title="DONE"
          count={getTasksByStatus("DONE").length}
          icon={<CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />}
          colorClass="bg-green-50"
        >
          {getTasksByStatus("DONE").map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </KanbanColumn>
      </div>

      {/* Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={projectId}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onUpdate={onTaskUpdate}
          members={members}
        />
      )}
    </DndContext>
  );
}
