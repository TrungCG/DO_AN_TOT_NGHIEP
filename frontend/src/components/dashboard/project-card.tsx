"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, FolderKanban, BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Project } from "@/types/project";
import { Task } from "@/types/task";
import { taskService } from "@/services/task";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProjectCardProps {
  project: Project;
  onLoadTries?: number;
}

export function ProjectCard({ project, onLoadTries = 0 }: ProjectCardProps) {
  const router = useRouter();
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasks = await taskService.getByProject(project.id);
        setProjectTasks(tasks);
      } catch (error) {
        if (onLoadTries < 3) {
          setTimeout(
            () => {
              fetchTasks();
            },
            1000 * (onLoadTries + 1)
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [project.id, onLoadTries]);

  const taskStats = {
    total: projectTasks.length,
    done: projectTasks.filter((t) => t.status === "DONE").length,
    inProgress: projectTasks.filter((t) => t.status === "INPR").length,
    todo: projectTasks.filter((t) => t.status === "TODO").length,
  };

  const completionPercentage =
    taskStats.total > 0
      ? Math.round((taskStats.done / taskStats.total) * 100)
      : 0;

  const highPriorityTasks = projectTasks.filter(
    (t) => t.priority === "HIGH" && t.status !== "DONE"
  ).length;

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer border-l-4 hover:scale-105 transform duration-200"
      onClick={() => router.push(`/projects/${project.id}`)}
      style={{
        borderLeftColor: `hsl(${completionPercentage * 1.2}, 70%, 60%)`,
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-xs mt-1">
              {project.description || "Không có mô tả"}
            </CardDescription>
          </div>
          <FolderKanban className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {!isLoading && taskStats.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Tiến độ</span>
              <span className="font-bold text-primary">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {taskStats.done} / {taskStats.total} hoàn thành
            </div>
          </div>
        )}

        {/* Task Stats */}
        {!isLoading && taskStats.total > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {taskStats.todo}
              </div>
              <div className="text-[10px] text-muted-foreground">Chưa làm</div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 text-center">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                {taskStats.inProgress}
              </div>
              <div className="text-[10px] text-muted-foreground">Đang làm</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2 text-center">
              <div className="text-xs font-semibold text-green-700 dark:text-green-300">
                {taskStats.done}
              </div>
              <div className="text-[10px] text-muted-foreground">Xong</div>
            </div>
          </div>
        )}

        {/* High Priority Alert */}
        {!isLoading && highPriorityTasks > 0 && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
            <div className="text-xs font-semibold text-red-700 dark:text-red-400">
              ⚠️ {highPriorityTasks} việc ưu tiên cao
            </div>
          </div>
        )}

        {/* Team Members */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex -space-x-2">
            {[project.owner, ...project.members.filter(m => m.id !== project.owner.id)]
              .slice(0, 3)
              .map((member, index) => (
                <Avatar key={`${member.id}-${index}`} className="h-6 w-6 border border-background">
                  <AvatarFallback className="text-xs font-bold">
                    {member.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            {project.members.length + 1 > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border border-background">
                +{project.members.length + 1 - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {project.members.length + 1} thành viên
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
