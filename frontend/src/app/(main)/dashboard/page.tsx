"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  User as UserIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  ArrowRight,
  ListTodo,
  Target,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast, parseISO, differenceInDays } from "date-fns";
import { vi, enUS } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { projectService } from "@/services/project";
import { taskService } from "@/services/task";
import { userService } from "@/services/user";
import { Project } from "@/types/project";
import { Task } from "@/types/task";
import { User } from "@/types/auth";
import { CreateProjectDialog } from "./create-project-dialog";
import { ProjectCard } from "@/components/dashboard/project-card";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { t, locale, getPriorityLabel, getStatusLabel } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [allAssignedTasks, setAllAssignedTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverdueDialog, setShowOverdueDialog] = useState(false);
  
  const dateLocale = locale === 'vi' ? vi : enUS;

  const fetchData = async () => {
    try {
      const [projectsData, personalTasksData, assignedTasksData, userData] = await Promise.all([
        projectService.getAll(),
        taskService.getPersonal(),
        taskService.getAssigned(),
        userService.getCurrentUser(),
      ]);
      setProjects(projectsData);
      setPersonalTasks(personalTasksData);
      setAllAssignedTasks(assignedTasksData);
      setCurrentUser(userData);
    } catch (error) {
      console.error(error);
      toast.error(t.dashboard.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.dashboard.greetingMorning;
    if (hour < 18) return t.dashboard.greetingAfternoon;
    return t.dashboard.greetingEvening;
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!currentUser) return "";
    if (currentUser.first_name && currentUser.last_name) {
      return `${currentUser.first_name} ${currentUser.last_name}`;
    }
    return currentUser.username;
  };

  // Calculate stats
  const todoTasks = allAssignedTasks.filter((t) => t.status === "TODO");
  const inProgressTasks = allAssignedTasks.filter((t) => t.status === "INPR");
  const doneTasks = allAssignedTasks.filter((t) => t.status === "DONE");
  const totalTasks = allAssignedTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  // Get today's and upcoming tasks
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = allAssignedTasks.filter(
    (t) => t.due_date && t.due_date.startsWith(today) && t.status !== "DONE"
  );

  // Get overdue tasks
  const overdueTasks = allAssignedTasks.filter((t) => {
    if (!t.due_date || t.status === "DONE") return false;
    return isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date));
  });

  // Get upcoming tasks (next 7 days, excluding today)
  const upcomingTasks = allAssignedTasks.filter((t) => {
    if (!t.due_date || t.status === "DONE") return false;
    const dueDate = parseISO(t.due_date);
    const daysUntil = differenceInDays(dueDate, new Date());
    return daysUntil > 0 && daysUntil <= 7;
  }).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  // High priority tasks
  const highPriorityTasks = allAssignedTasks.filter(
    (t) => t.priority === "HIGH" && t.status !== "DONE"
  );

  // Helper to get project name for a task
  const getTaskSource = (task: Task) => {
    if (task.is_personal) {
      return { label: t.sidebar.personalTasks, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" };
    }
    const project = projects.find(p => p.id === task.project);
    return { 
      label: project?.name || t.dashboard.project, 
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
    };
  };

  // Format due date
  const formatDueDate = (date: string) => {
    const parsed = parseISO(date);
    if (isToday(parsed)) return t.dashboard.today;
    if (isTomorrow(parsed)) return t.dashboard.tomorrow;
    return format(parsed, "dd/MM", { locale: dateLocale });
  };

  const handleTaskClick = (task: Task) => {
    if (task.is_personal) {
      router.push(`/my-tasks?taskId=${task.id}`);
    } else {
      router.push(`/projects/${task.project}?taskId=${task.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header with Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {getGreeting()}, {getUserDisplayName()}! 👋
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: dateLocale })}
          </p>
        </div>
        <CreateProjectDialog onSuccess={fetchData} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.dashboard.totalTasks}</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-200 dark:border-orange-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.dashboard.inProgress}</p>
                <p className="text-2xl font-bold">{inProgressTasks.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-200 dark:border-green-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.dashboard.completed}</p>
                <p className="text-2xl font-bold">{doneTasks.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-200 dark:border-purple-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.dashboard.completionRate}</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <Progress value={completionRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Tasks Alert */}
          {overdueTasks.length > 0 && (
            <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  {t.dashboard.overdueTasks} ({overdueTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueTasks.slice(0, 3).map((task) => {
                  const source = getTaskSource(task);
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 hover:bg-red-100 dark:hover:bg-red-950/50 cursor-pointer transition-colors border border-red-200 dark:border-red-900"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("px-2 py-0.5 rounded text-xs", source.color)}>
                            {source.label}
                          </span>
                          <span className="text-xs text-red-600 dark:text-red-400">
                            {t.dashboard.overdueDays.replace('{days}', String(Math.abs(differenceInDays(parseISO(task.due_date!), new Date()))))}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  );
                })}
                {overdueTasks.length > 3 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-red-600"
                    onClick={() => setShowOverdueDialog(true)}
                  >
                    {t.dashboard.viewAllOverdue.replace('{count}', String(overdueTasks.length))}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Today's Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  {t.dashboard.todaysTasks}
                </CardTitle>
                <Badge variant="secondary">{todayTasks.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
                  <p>{t.dashboard.noTasksTodayMessage}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayTasks.map((task) => {
                    const source = getTaskSource(task);
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn("px-2 py-0.5 rounded text-xs", source.color)}>
                              {source.label}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                task.priority === "HIGH" && "border-red-500 text-red-500",
                                task.priority === "MED" && "border-yellow-500 text-yellow-500",
                                task.priority === "LOW" && "border-green-500 text-green-500"
                              )}
                            >
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant={task.status === "INPR" ? "default" : "secondary"}>
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          {upcomingTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    {t.dashboard.upcoming7Days}
                  </CardTitle>
                  <Badge variant="secondary">{upcomingTasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingTasks.slice(0, 5).map((task) => {
                    const source = getTaskSource(task);
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.title}</p>
                          <span className={cn("px-2 py-0.5 rounded text-xs", source.color)}>
                            {source.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{formatDueDate(task.due_date!)}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Projects & Quick Info */}
        <div className="space-y-6">
          {/* High Priority Tasks */}
          {highPriorityTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-red-500" />
                  {t.dashboard.highPriority}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {highPriorityTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDueDate(task.due_date)}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Projects Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-indigo-500" />
                  {t.dashboard.myProjects}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push("/my-projects")}
                >
                  {t.dashboard.viewAll}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t.dashboard.noProjects}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="h-8 w-8 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.dashboard.membersCount.replace('{count}', String(project.members.length + 1))}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Tasks Quick View */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-purple-500" />
                  {t.sidebar.personalTasks}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push("/my-tasks")}
                >
                  {t.dashboard.viewAll}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <p className="text-lg font-bold">{personalTasks.filter(task => task.status === "TODO").length}</p>
                  <p className="text-xs text-muted-foreground">{t.dashboard.todo}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{personalTasks.filter(task => task.status === "INPR").length}</p>
                  <p className="text-xs text-muted-foreground">{t.dashboard.inProgress}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{personalTasks.filter(task => task.status === "DONE").length}</p>
                  <p className="text-xs text-muted-foreground">{t.dashboard.done}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Overdue Tasks Dialog */}
      <Dialog open={showOverdueDialog} onOpenChange={setShowOverdueDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              {t.dashboard.overdueTasks} ({overdueTasks.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-2">
              {overdueTasks.map((task) => {
                const source = getTaskSource(task);
                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setShowOverdueDialog(false);
                      handleTaskClick(task);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 cursor-pointer transition-colors border border-red-200 dark:border-red-900"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("px-2 py-0.5 rounded text-xs", source.color)}>
                          {source.label}
                        </span>
                        <span className="text-xs text-red-600 dark:text-red-400">
                          {t.dashboard.overdueDays.replace('{days}', String(Math.abs(differenceInDays(parseISO(task.due_date!), new Date()))))}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
