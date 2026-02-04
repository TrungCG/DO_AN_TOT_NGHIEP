"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/task";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DraggableTaskCardProps {
  task: Task;
  onClick: () => void;
}

export function DraggableTaskCard({ task, onClick }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id.toString(),
    data: { task },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "destructive";
      case "MED":
        return "default";
      case "LOW":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="touch-none"
    >
      <Card
        className="shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-card"
        onClick={onClick}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
            <Badge
              variant={getPriorityColor(task.priority)}
              className="text-[10px] px-1 py-0"
            >
              {task.priority}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description || "Không có mô tả"}
          </p>
          {task.assignee && (
            <div className="mt-2 text-xs font-medium text-foreground flex items-center">
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center mr-1 text-[10px]">
                {task.assignee.username.charAt(0).toUpperCase()}
              </div>
              {task.assignee.username}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
