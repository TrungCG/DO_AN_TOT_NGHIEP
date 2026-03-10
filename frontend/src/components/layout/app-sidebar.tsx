"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { userService } from "@/services/user";
import { projectService } from "@/services/project";
import { taskService } from "@/services/task";
import { User as UserType } from "@/types/auth";
import { Project } from "@/types/project";
import { Task } from "@/types/task";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RecentPopover } from "./recent-popover";
import { Hash } from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [todayExpanded, setTodayExpanded] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);

  const fetchSidebarData = async () => {
    try {
      const [user, projectsData, tasksData, personalTasksData] = await Promise.all([
        userService.getCurrentUser(),
        projectService.getAll(),
        taskService.getAssigned(),
        taskService.getPersonal(),
      ]);
      setCurrentUser(user);
      setProjects(projectsData);
      setTasks(tasksData);
      setPersonalTasks(personalTasksData);
    } catch (error) {
      console.error("Failed to fetch sidebar data:", error);
    }
  };

  useEffect(() => {
    fetchSidebarData();
  }, [pathname]); // Refresh when navigating to a new page

  const personalTaskCount = personalTasks.filter((t) => t.status !== "DONE").length;

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(
    (t) => t.due_date && t.due_date.startsWith(today) && t.status !== "DONE"
  );

  const getUserInitials = (user: UserType | null) => {
    if (!user) return "U";
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username[0].toUpperCase();
  };

  const getUserDisplayName = (user: UserType | null) => {
    if (!user) return "Người dùng";
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-500";
      case "MED":
        return "text-yellow-500";
      default:
        return "text-slate-400";
    }
  };

  const getTaskLink = (task: Task) => {
    // If task has a project, navigate to project page
    if (task.project && typeof task.project === "object" && task.project.id) {
      return `/projects/${task.project.id}`;
    }
    if (task.project && typeof task.project === "number") {
      return `/projects/${task.project}`;
    }
    // Otherwise, it's a personal task
    return "/my-tasks";
  };

  const mainLinks = [
    { href: "/dashboard", label: t.sidebar.dashboard, icon: LayoutDashboard },
    {
      href: "/my-tasks",
      label: t.sidebar.personalTasks,
      icon: ListTodo,
      badge: personalTaskCount > 0 ? personalTaskCount : undefined,
    },
    {
      href: "/my-projects",
      label: t.sidebar.projects,
      icon: FolderKanban,
      badge: projects.length > 0 ? projects.length : undefined,
    },
  ];

  return (
    <TooltipProvider>
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col fixed left-0 top-0 shadow-sm">
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <FolderKanban className="h-5.5 w-5.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-none">
                CG SoftWare
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-none mt-1">
                Task Manager
              </span>
            </div>
          </Link>
          <div className="flex items-center">
            <NotificationBell />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* User Profile Section */}
        <div className="px-3 py-4">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 p-2.5 rounded-lg transition-all",
              pathname === "/profile"
                ? "bg-orange-50 dark:bg-orange-950/30"
                : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
          >
            <Avatar className="h-9 w-9 border-2 border-orange-200 dark:border-orange-800">
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white text-sm font-semibold">
                {getUserInitials(currentUser)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {getUserDisplayName(currentUser)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentUser?.email || "email@example.com"}
              </p>
            </div>
          </Link>
        </div>

        <Separator className="mx-3" />

        {/* Main Navigation */}
        <div className="px-3 py-3">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
            {t.sidebar.mainMenu}
          </p>
          <nav className="space-y-1">
            {mainLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    pathname === link.href
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <link.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{link.label}</span>
                  {link.badge && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {link.badge > 99 ? "99+" : link.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <Separator className="mx-3" />

        {/* Today Section */}
        <div className="px-3 py-3">
          <button
            onClick={() => setTodayExpanded(!todayExpanded)}
            className="flex items-center justify-between w-full px-2 mb-2 group"
          >
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {t.sidebar.today}
              </p>
              {todayTasks.length > 0 && (
                <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                  {todayTasks.length}
                </span>
              )}
            </div>
            {todayExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>

          {todayExpanded && (
            <div className="space-y-1">
              {todayTasks.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 dark:text-slate-500">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{t.sidebar.noTasksToday}</span>
                </div>
              ) : (
                todayTasks.slice(0, 5).map((task) => {
                  // Get project name for display
                  let projectName = "";
                  if (task.project) {
                    if (typeof task.project === "object") {
                      projectName = task.project.name;
                    } else {
                      // task.project is a number, find from projects list
                      const foundProject = projects.find((p) => p.id === task.project);
                      projectName = foundProject?.name || t.sidebar.projects;
                    }
                  }

                  return (
                    <Link key={task.id} href={getTaskLink(task)}>
                      <div className="flex items-start gap-2 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                        <Circle
                          className={cn(
                            "h-3 w-3 mt-0.5 flex-shrink-0",
                            getPriorityColor(task.priority)
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 dark:text-slate-300 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400">
                            {task.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                            {task.is_personal ? (
                              <>
                                <User className="h-2.5 w-2.5" />
                                <span>{t.sidebar.personalTasks}</span>
                              </>
                            ) : (
                              <>
                                <Hash className="h-2.5 w-2.5" />
                                <span>{projectName}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
              {todayTasks.length > 5 && (
                <Link href="/my-tasks">
                  <div className="px-3 py-1 text-[10px] text-orange-600 dark:text-orange-400 hover:underline">
                    +{todayTasks.length - 5} {t.sidebar.moreTasksCount}
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>

        <Separator className="mx-3" />

        {/* Recent Section - Collapsible with popover for "View all" */}
        <div className="px-3 py-3">
          <RecentPopover projects={projects} />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm h-9 text-red-500 dark:text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => {
              authService.logout();
              window.location.href = "/login";
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t.sidebar.logout}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

