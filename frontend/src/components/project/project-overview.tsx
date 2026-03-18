"use client";

import { Task } from "@/types/task";
import { User } from "@/types/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertCircle, CheckCircle2, Clock, ListTodo, Users, TrendingUp } from "lucide-react";

interface ProjectOverviewProps {
  tasks: Task[];
  members: User[];
  canViewMemberProgress?: boolean;
}

export function ProjectOverview({ tasks, members, canViewMemberProgress = false }: ProjectOverviewProps) {
  // Status Distribution
  const statusData = [
    {
      name: "Việc cần làm",
      value: tasks.filter((t) => t.status === "TODO").length,
      color: "#ef4444",
    },
    {
      name: "Đang tiến hành",
      value: tasks.filter((t) => t.status === "INPR").length,
      color: "#3b82f6",
    },
    {
      name: "Xong",
      value: tasks.filter((t) => t.status === "DONE").length,
      color: "#22c55e",
    },
  ];

  // Tasks by Member
  const memberData = members
    .map((member) => ({
      name: member.username,
      tasks: tasks.filter((t) => t.assignee?.id === member.id).length,
    }))
    .filter((m) => m.tasks > 0);

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
    return (
      dueDate.toDateString() === today.toDateString()
    );
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

  // Member Progress Data
  const memberProgressData = members.map((member) => {
    const memberTasks = tasks.filter((t) => t.assignee?.id === member.id);
    const totalTasks = memberTasks.length;
    const completedTasks = memberTasks.filter((t) => t.status === "DONE").length;
    const inProgressTasks = memberTasks.filter((t) => t.status === "INPR").length;
    const todoTasks = memberTasks.filter((t) => t.status === "TODO").length;
    const overdueTasks = memberTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && t.status !== "DONE"
    ).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: member.id,
      name: member.first_name && member.last_name 
        ? `${member.first_name} ${member.last_name}` 
        : member.username,
      username: member.username,
      initial: member.first_name?.[0] || member.username[0],
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      completionRate,
    };
  }).sort((a, b) => b.totalTasks - a.totalTasks);

  // Get user initials
  const getUserInitial = (member: User) => {
    return member.first_name?.[0] || member.username[0];
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng công việc</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% hoàn thành
            </p>
          </CardContent>
        </Card>

        {/* To Do */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cần làm</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {tasks.filter((t) => t.status === "TODO").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Chờ bắt đầu
            </p>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang làm</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {tasks.filter((t) => t.status === "INPR").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Đang thực hiện
            </p>
          </CardContent>
        </Card>

        {/* Done */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {tasks.filter((t) => t.status === "DONE").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% tổng số
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deadline Alert Card */}
      {(overdueTasks > 0 || dueTodayTasks > 0) && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">⚠️ Cảnh báo Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 text-sm">
              {overdueTasks > 0 && (
                <div>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    {overdueTasks} quá hạn
                  </p>
                  <p className="text-xs text-muted-foreground">Cần xử lý ngay</p>
                </div>
              )}
              {dueTodayTasks > 0 && (
                <div>
                  <p className="font-semibold text-orange-600 dark:text-orange-400">
                    {dueTodayTasks} hôm nay
                  </p>
                  <p className="text-xs text-muted-foreground">Deadline hôm nay</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        {statusData.some((s) => s.value > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phân bố Trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusDataWithPercent}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {statusDataWithPercent.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, "Số lượng"]}
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #ccc",
                      borderRadius: "6px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend Below */}
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                {statusDataWithPercent.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {/* Dynamic color from data */}
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.name}: {item.value} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Priority Distribution */}
        {priorityData.some((p) => p.value > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phân bố Độ ưu tiên</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={priorityDataWithPercent}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {priorityDataWithPercent.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, "Số lượng"]}
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #ccc",
                      borderRadius: "6px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend Below */}
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                {priorityDataWithPercent.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {/* Dynamic color from data */}
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.name}: {item.value} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks by Member */}
        {memberData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Công việc theo Thành viên</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={memberData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #ccc",
                      borderRadius: "6px"
                    }}
                  />
                  <Bar dataKey="tasks" fill="#3b82f6" name="Số công việc" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Member Progress Section - Only for owner/admin */}
      {canViewMemberProgress && memberProgressData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Tiến độ từng Thành viên</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Theo dõi tiến độ hoàn thành công việc của từng thành viên
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberProgressData.map((member) => (
                <div key={member.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white text-sm font-semibold">
                          {member.initial.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">@{member.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-bold text-lg">{member.completionRate}%</span>
                    </div>
                  </div>
                  
                  <Progress value={member.completionRate} className="h-2 mb-3" />
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <ListTodo className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-muted-foreground text-xs">Tổng</p>
                        <p className="font-semibold">{member.totalTasks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-muted-foreground text-xs">Cần làm</p>
                        <p className="font-semibold text-red-600">{member.todoTasks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-muted-foreground text-xs">Đang làm</p>
                        <p className="font-semibold text-blue-600">{member.inProgressTasks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-muted-foreground text-xs">Xong</p>
                        <p className="font-semibold text-green-600">{member.completedTasks}</p>
                      </div>
                    </div>
                    {member.overdueTasks > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/30 rounded">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-muted-foreground text-xs">Quá hạn</p>
                          <p className="font-semibold text-orange-600">{member.overdueTasks}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
