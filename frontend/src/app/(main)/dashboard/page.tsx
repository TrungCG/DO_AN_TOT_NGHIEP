"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  User as UserIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { projectService } from "@/services/project";
import { taskService } from "@/services/task";
import { Project } from "@/types/project";
import { Task } from "@/types/task";
import { CreateProjectDialog } from "./create-project-dialog";

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [projectsData, tasksData] = await Promise.all([
        projectService.getAll(),
        taskService.getPersonal(),
      ]);
      setProjects(projectsData);
      setPersonalTasks(tasksData);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải dữ liệu dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Stats Calculation
  const taskStats = [
    {
      name: "To Do",
      value: personalTasks.filter((t) => t.status === "TODO").length,
      color: "#9ca3af",
    },
    {
      name: "In Progress",
      value: personalTasks.filter((t) => t.status === "INPR").length,
      color: "#3b82f6",
    },
    {
      name: "Done",
      value: personalTasks.filter((t) => t.status === "DONE").length,
      color: "#22c55e",
    },
  ];

  if (isLoading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Tổng quan</h1>
        <CreateProjectDialog onSuccess={fetchData} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số dự án</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              dự án bạn đang tham gia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Việc cá nhân</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personalTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              công việc chưa hoàn thành:{" "}
              {personalTasks.filter((t) => t.status !== "DONE").length}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tiến độ việc cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStats} layout="vertical" barSize={20}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {taskStats.map((entry, index) => (
                    <Cell key={"cell-" + index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Dự án gần đây
        </h2>
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg shadow-sm border">
            <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">
              Chưa có dự án nào
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bắt đầu bằng cách tạo dự án mới.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push("/projects/" + project.id)}
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="truncate">{project.name}</span>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || "Không có mô tả"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <div className="flex items-center">
                      <UserIcon className="mr-1 h-4 w-4" />
                      {project.owner.username}
                    </div>
                    <div>{project.members.length + 1} thành viên</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
