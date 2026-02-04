"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { taskService } from "@/services/task";
import { Task } from "@/types/task";
import { CreateTaskDialog } from "@/components/project/create-task-dialog";
import { KanbanBoard } from "@/components/project/kanban-board";

export default function MyTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await taskService.getPersonal();
      setTasks(data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải công việc cá nhân.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4 pl-0"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại Dashboard
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Việc của tôi</h1>
            <p className="text-muted-foreground mt-2">
              Quản lý các công việc cá nhân không thuộc dự án nào.
            </p>
          </div>
          {/* Note: CreateTaskDialog currently requires projectId. We need to adapt it or create a new one for Personal Tasks.
              For now, let's assume we pass projectId={0} or similar to signal personal task?
              Actually, taskService.createPersonal doesn't need projectId.
              We should refactor CreateTaskDialog to handle personal mode.
              Let's do a quick hack: projectId={-1} means personal. */}
          <CreateTaskDialog projectId={-1} onSuccess={fetchData} />
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        projectId={-1}
        initialTasks={tasks}
        onTaskUpdate={fetchData}
        members={[]} // No members for personal tasks
      />
    </div>
  );
}
