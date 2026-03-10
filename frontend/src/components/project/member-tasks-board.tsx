"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { Task, TaskStatus } from "@/types/task";
import { User } from "@/types/auth";
import { taskService } from "@/services/task";
import { useI18n } from "@/lib/i18n";
import { KanbanColumn } from "./kanban-column";
import { DraggableTaskCard } from "./draggable-task-card";
import { TaskDetailModal } from "./task-detail-modal";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";

interface MemberTasksBoardProps {
  projectId: number;
  initialTasks: Task[];
  onTaskUpdate: () => void;
  members: User[];
  ownerId?: number;
}

export function MemberTasksBoard({
  projectId,
  initialTasks,
  onTaskUpdate,
  members,
  ownerId,
}: MemberTasksBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { getDisplayName } = useCurrentUser();
  const { getStatusLabel } = useI18n();

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
    const task = tasks.find((t) => t.id === taskId);

    // Extract status from column ID (format: "memberId-STATUS" or "unassigned-STATUS")
    let newStatus: TaskStatus = "TODO";
    const overId = over.id as string;
    
    if (overId.endsWith("-TODO")) {
      newStatus = "TODO";
    } else if (overId.endsWith("-INPR")) {
      newStatus = "INPR";
    } else if (overId.endsWith("-DONE")) {
      newStatus = "DONE";
    }

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

  const getTasksByMemberAndStatus = (member: User, status: TaskStatus) => {
    const filtered = tasks.filter(
      (task) =>
        task.assignee?.id === member.id &&
        task.status === status
    );
    
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

  // Get unique members that have tasks
  const membersWithTasks = members.filter((member) =>
    tasks.some((task) => task.assignee?.id === member.id)
  );

  // Unassigned tasks - sorted by overdue + priority
  const unassignedTasks = tasks
    .filter((task) => !task.assignee)
    .sort((a, b) => {
      const now = new Date();
      const isPastA = a.due_date ? new Date(a.due_date) < now && a.status !== "DONE" : false;
      const isPastB = b.due_date ? new Date(b.due_date) < now && b.status !== "DONE" : false;
      
      // Quá hạn lên trên
      if (isPastA && !isPastB) return -1;
      if (!isPastA && isPastB) return 1;
      
      // Sắp xếp theo độ ưu tiên
      const priorityOrder = { HIGH: 0, MED: 1, LOW: 2 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
    });

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-8">
        {/* Members with tasks */}
        {membersWithTasks.map((member) => (
          <div key={member.id}>
            {/* Member header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="font-bold">
                  {member.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{getDisplayName(member.id, member.username)}</h3>
                <p className="text-xs text-muted-foreground">
                  {tasks.filter((t) => t.assignee?.id === member.id).length} công việc
                </p>
              </div>
            </div>

            {/* Member's 3-column board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KanbanColumn
                id={`${member.id}-TODO`}
                title={getStatusLabel("TODO")}
                count={getTasksByMemberAndStatus(member, "TODO").length}
                icon={<AlertCircle className="mr-2 h-5 w-5 text-gray-500" />}
                colorClass="bg-gray-100"
              >
                {getTasksByMemberAndStatus(member, "TODO").map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </KanbanColumn>

              <KanbanColumn
                id={`${member.id}-INPR`}
                title={getStatusLabel("INPR")}
                count={getTasksByMemberAndStatus(member, "INPR").length}
                icon={<Clock className="mr-2 h-5 w-5 text-blue-500" />}
                colorClass="bg-blue-50"
              >
                {getTasksByMemberAndStatus(member, "INPR").map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </KanbanColumn>

              <KanbanColumn
                id={`${member.id}-DONE`}
                title={getStatusLabel("DONE")}
                count={getTasksByMemberAndStatus(member, "DONE").length}
                icon={<CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />}
                colorClass="bg-green-50"
              >
                {getTasksByMemberAndStatus(member, "DONE").map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </KanbanColumn>
            </div>
          </div>
        ))}

        {/* Unassigned tasks */}
        {unassignedTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-bold text-muted-foreground">?</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Chưa giao việc</h3>
                <p className="text-xs text-muted-foreground">
                  {unassignedTasks.length} công việc
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KanbanColumn
                id="unassigned-TODO"
                title={getStatusLabel("TODO")}
                count={unassignedTasks.filter((t) => t.status === "TODO").length}
                icon={<AlertCircle className="mr-2 h-5 w-5 text-gray-500" />}
                colorClass="bg-gray-100"
              >
                {unassignedTasks
                  .filter((t) => t.status === "TODO")
                  .map((task) => (
                    <DraggableTaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
              </KanbanColumn>

              <KanbanColumn
                id="unassigned-INPR"
                title={getStatusLabel("INPR")}
                count={unassignedTasks.filter((t) => t.status === "INPR").length}
                icon={<Clock className="mr-2 h-5 w-5 text-blue-500" />}
                colorClass="bg-blue-50"
              >
                {unassignedTasks
                  .filter((t) => t.status === "INPR")
                  .map((task) => (
                    <DraggableTaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
              </KanbanColumn>

              <KanbanColumn
                id="unassigned-DONE"
                title={getStatusLabel("DONE")}
                count={unassignedTasks.filter((t) => t.status === "DONE").length}
                icon={<CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />}
                colorClass="bg-green-50"
              >
                {unassignedTasks
                  .filter((t) => t.status === "DONE")
                  .map((task) => (
                    <DraggableTaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
              </KanbanColumn>
            </div>
          </div>
        )}

        {/* Empty state */}
        {membersWithTasks.length === 0 && unassignedTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Không có công việc nào
          </div>
        )}
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
          ownerId={ownerId}
        />
      )}
    </DndContext>
  );
}
