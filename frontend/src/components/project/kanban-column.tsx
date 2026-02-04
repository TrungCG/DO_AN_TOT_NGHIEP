"use client";

import { useDroppable } from "@dnd-kit/core";
import { TaskStatus } from "@/types/task";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  colorClass: string;
}

export function KanbanColumn({
  id,
  title,
  icon,
  count,
  children,
  colorClass,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-4 rounded-lg transition-colors",
        colorClass,
        isOver && "ring-2 ring-primary ring-inset bg-opacity-80",
      )}
    >
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="font-semibold text-foreground ml-2">
          {title} ({count})
        </h3>
      </div>
      <div className="space-y-4 min-h-[200px]">{children}</div>
    </div>
  );
}
