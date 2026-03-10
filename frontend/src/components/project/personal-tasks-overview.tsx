"use client";

import { Task } from "@/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { AlertCircle, CheckCircle2, Clock, ListTodo, Calendar } from "lucide-react";

interface PersonalTasksOverviewProps {
  tasks: Task[];
}

export function PersonalTasksOverview({ tasks }: PersonalTasksOverviewProps) {
  // Status Distribution
  const statusData = [
    {
      name: "Chờ làm",
      value: tasks.filter((t) => t.status === "TODO").length,
      color: "#ef4444",
    },
    {
      name: "Đang làm",
      value: tasks.filter((t) => t.status === "INPR").length,
      color: "#3b82f6",
    },
    {
      name: "Hoàn thành",
      value: tasks.filter((t) => t.status === "DONE").length,
      color: "#22c55e",
    },
  ];

  // Priority Distribution
  const priorityData = [
    {
      name: "Cao",
      value: tasks.filter((t) => t.priority === "HIGH").length,
      color: "#ef4444",
    },
    {
      name: "Trung bình",
      value: tasks.filter((t) => t.priority === "MED").length,
      color: "#f59e0b",
    },
    {
      name: "Thấp",
      value: tasks.filter((t) => t.priority === "LOW").length,
      color: "#10b981",
    },
  ];

  // Deadline stats
  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < now && t.status !== "DONE"
  ).length;
  const dueTodayTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "DONE") return false;
    const dueDate = new Date(t.due_date);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  }).length;
  const dueThisWeekTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "DONE") return false;
    const dueDate = new Date(t.due_date);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= weekFromNow;
  }).length;

  // Completion rate
  const completionRate = Math.round(
    (tasks.filter((t) => t.status === "DONE").length / Math.max(tasks.length, 1)) * 100
  );

  // Calculate percentages
  const totalStatusTasks = statusData.reduce((sum, item) => sum + item.value, 0);
  const totalPriorityTasks = priorityData.reduce((sum, item) => sum + item.value, 0);

  const statusDataWithPercent = statusData.map((item) => ({
    ...item,
    percentage: totalStatusTasks > 0 ? Math.round((item.value / totalStatusTasks) * 100) : 0,
  }));

  const priorityDataWithPercent = priorityData.map((item) => ({
    ...item,
    percentage: totalPriorityTasks > 0 ? Math.round((item.value / totalPriorityTasks) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ListTodo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-sm text-muted-foreground">Tổng công việc</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueTasks}</p>
                <p className="text-sm text-muted-foreground">Quá hạn</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dueTodayTasks}</p>
                <p className="text-sm text-muted-foreground">Đến hạn hôm nay</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân bố trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={statusDataWithPercent}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDataWithPercent.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {statusDataWithPercent.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-medium ml-auto">{item.value}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân bố độ ưu tiên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={priorityDataWithPercent}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {priorityDataWithPercent.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {priorityDataWithPercent.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-medium ml-auto">{item.value}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Công việc sắp tới
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Quá hạn</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{overdueTasks}</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Hôm nay</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{dueTodayTasks}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Tuần này</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dueThisWeekTasks}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
