"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
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

  const getHeaderColor = (id: string) => {
    // Handle both simple IDs (TODO, INPR, DONE) and composite IDs (123-TODO, 123-INPR, etc.)
    if (id.endsWith("TODO") || id === "TODO") {
      return "text-gray-600 dark:text-gray-300";
    } else if (id.endsWith("INPR") || id === "INPR") {
      return "text-blue-600 dark:text-blue-400";
    } else if (id.endsWith("DONE") || id === "DONE") {
      return "text-green-600 dark:text-green-400";
    }
    return "text-gray-600 dark:text-gray-300";
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-gray-50 dark:bg-slate-900/50 rounded-lg transition-all duration-200 flex-shrink-0 w-[350px]",
        "border border-gray-200 dark:border-slate-700",
        isOver && "ring-2 ring-blue-500 ring-inset bg-blue-50/50 dark:bg-blue-950/20",
      )}
    >
      {/* Column Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className={cn("text-base", getHeaderColor(id))}>
            {icon}
          </span>
          <h3 className={cn(
            "font-semibold text-sm flex-1",
            getHeaderColor(id)
          )}>
            {title}
          </h3>
          <span className={cn(
            "inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold",
            "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300",
            getHeaderColor(id)
          )}>
            {count}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {children}
      </div>
    </div>
  );
}
