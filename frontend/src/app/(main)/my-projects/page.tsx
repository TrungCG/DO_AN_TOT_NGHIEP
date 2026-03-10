"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Plus,
  Search,
  Grid3X3,
  List,
  Users,
  ArrowLeft,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { vi, enUS } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { projectService } from "@/services/project";
import { taskService } from "@/services/task";
import { userService } from "@/services/user";
import { Project } from "@/types/project";
import { User } from "@/types/auth";
import type { Locale as DateFnsLocale } from "date-fns";

type SortOption = "name" | "created" | "updated" | "members";
type ViewMode = "grid" | "list";

interface ProjectWithStats extends Project {
  taskStats: {
    total: number;
    done: number;
    inProgress: number;
    todo: number;
  };
  completionPercentage: number;
}

export default function MyProjectsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const dateLocale = locale === "vi" ? vi : enUS;

  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterOwner, setFilterOwner] = useState<"all" | "mine" | "member">("all");
  
  // Create project dialog state
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const fetchData = async () => {
    try {
      const [projectsData, userData] = await Promise.all([
        projectService.getAll(),
        userService.getCurrentUser(),
      ]);

      // Fetch tasks for each project to calculate stats
      const projectsWithStats = await Promise.all(
        projectsData.map(async (project) => {
          try {
            const tasks = await taskService.getByProject(project.id);
            const taskStats = {
              total: tasks.length,
              done: tasks.filter((t) => t.status === "DONE").length,
              inProgress: tasks.filter((t) => t.status === "INPR").length,
              todo: tasks.filter((t) => t.status === "TODO").length,
            };
            const completionPercentage =
              taskStats.total > 0
                ? Math.round((taskStats.done / taskStats.total) * 100)
                : 0;
            return { ...project, taskStats, completionPercentage };
          } catch {
            return {
              ...project,
              taskStats: { total: 0, done: 0, inProgress: 0, todo: 0 },
              completionPercentage: 0,
            };
          }
        })
      );

      setProjects(projectsWithStats);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error(t.project.projectNameRequired);
      return;
    }
    setIsCreatingProject(true);
    try {
      await projectService.create({
        name: newProjectName,
        description: newProjectDesc,
      });
      toast.success(t.project.createSuccess);
      setIsCreateProjectOpen(false);
      setNewProjectName("");
      setNewProjectDesc("");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(t.project.createError);
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project) => {
      // Search filter
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Owner filter
      let matchesOwner = true;
      if (filterOwner === "mine") {
        matchesOwner = project.owner.id === currentUser?.id;
      } else if (filterOwner === "member") {
        matchesOwner = project.owner.id !== currentUser?.id;
      }

      return matchesSearch && matchesOwner;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "created":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "updated":
          comparison =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case "members":
          comparison = a.members.length - b.members.length;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const getUserInitials = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username[0].toUpperCase();
  };

  const myProjects = projects.filter((p) => p.owner.id === currentUser?.id);

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.common.back}
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-orange-500" />
                {t.dashboard.myProjects}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {projects.length} {t.sidebar.projects.toLowerCase()}
                {myProjects.length > 0 && ` • ${myProjects.length} ${locale === 'vi' ? 'của bạn' : 'owned'}`}
              </p>
            </div>
          </div>

          <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                {t.dashboard.createNewProject}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t.project.createProjectTitle}</DialogTitle>
                <DialogDescription>{t.project.createProjectDesc}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="project-name">{t.project.projectName}</Label>
                  <Input
                    id="project-name"
                    placeholder={t.project.projectNamePlaceholder}
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project-desc">{t.common.description}</Label>
                  <Textarea
                    id="project-desc"
                    placeholder={t.project.projectDescPlaceholder}
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={handleCreateProject}
                  disabled={isCreatingProject}
                >
                  {isCreatingProject && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t.project.saveProject}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-gray-50 dark:bg-slate-950 border-b px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.common.search + "..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Filter by ownership */}
          <Select value={filterOwner} onValueChange={(v) => setFilterOwner(v as typeof filterOwner)}>
            <SelectTrigger className="w-40 h-9">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === 'vi' ? 'Tất cả dự án' : 'All projects'}</SelectItem>
              <SelectItem value="mine">{locale === 'vi' ? 'Do tôi tạo' : 'My projects'}</SelectItem>
              <SelectItem value="member">{locale === 'vi' ? 'Tham gia' : 'Member of'}</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">{locale === 'vi' ? 'Cập nhật gần đây' : 'Recently updated'}</SelectItem>
              <SelectItem value="created">{locale === 'vi' ? 'Ngày tạo' : 'Created date'}</SelectItem>
              <SelectItem value="name">{locale === 'vi' ? 'Tên' : 'Name'}</SelectItem>
              <SelectItem value="members">{locale === 'vi' ? 'Số thành viên' : 'Members'}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex border rounded-md overflow-hidden ml-auto">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Content */}
      <div className="flex-1 bg-gray-50 dark:bg-slate-950 p-6 overflow-auto">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            {searchQuery || filterOwner !== "all" ? (
              <>
                <p className="text-muted-foreground mb-2">
                  {locale === 'vi' ? 'Không tìm thấy dự án phù hợp' : 'No matching projects found'}
                </p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterOwner("all"); }}>
                  {locale === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'}
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">{t.dashboard.noProjects}</p>
                <Button onClick={() => setIsCreateProjectOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.dashboard.createNewProject}
                </Button>
              </>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => (
              <ProjectGridCard
                key={project.id}
                project={project}
                currentUser={currentUser}
                getUserInitials={getUserInitials}
                locale={locale}
                onClick={() => router.push(`/projects/${project.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <ProjectListCard
                key={project.id}
                project={project}
                currentUser={currentUser}
                getUserInitials={getUserInitials}
                locale={locale}
                dateLocale={dateLocale}
                onClick={() => router.push(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: ProjectWithStats;
  currentUser: User | null;
  getUserInitials: (user: User) => string;
  locale: string;
  dateLocale: DateFnsLocale;
  onClick: () => void;
}

function ProjectGridCard({
  project,
  currentUser,
  getUserInitials,
  locale,
  onClick,
}: Omit<ProjectCardProps, 'dateLocale'>) {
  const isOwner = project.owner.id === currentUser?.id;
  const { taskStats, completionPercentage } = project;

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer border-l-4 hover:scale-[1.02] transform duration-200"
      onClick={onClick}
      style={{
        borderLeftColor: `hsl(${completionPercentage * 1.2}, 70%, 60%)`,
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-xs mt-1">
              {project.description || (locale === 'vi' ? 'Không có mô tả' : 'No description')}
            </CardDescription>
          </div>
          {isOwner && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-600 border-orange-200">
              {locale === 'vi' ? 'Chủ sở hữu' : 'Owner'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {taskStats.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                {locale === 'vi' ? 'Tiến độ' : 'Progress'}
              </span>
              <span className="font-bold text-primary">{completionPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {taskStats.done} / {taskStats.total} {locale === 'vi' ? 'hoàn thành' : 'completed'}
            </div>
          </div>
        )}

        {/* Task Stats */}
        {taskStats.total > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {taskStats.todo}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {locale === 'vi' ? 'Chưa làm' : 'To Do'}
              </div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 text-center">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                {taskStats.inProgress}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {locale === 'vi' ? 'Đang làm' : 'In Progress'}
              </div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2 text-center">
              <div className="text-xs font-semibold text-green-700 dark:text-green-300">
                {taskStats.done}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {locale === 'vi' ? 'Xong' : 'Done'}
              </div>
            </div>
          </div>
        )}

        {/* No tasks message */}
        {taskStats.total === 0 && (
          <div className="text-center py-2 text-xs text-muted-foreground">
            {locale === 'vi' ? 'Chưa có công việc' : 'No tasks yet'}
          </div>
        )}

        {/* Team Members */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex -space-x-2">
              {[project.owner, ...project.members.filter((m) => m.id !== project.owner.id)]
                .slice(0, 4)
                .map((member, index) => (
                  <Avatar
                    key={`${member.id}-${index}`}
                    className="h-6 w-6 border-2 border-background"
                  >
                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-orange-400 to-amber-500 text-white">
                      {getUserInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              {project.members.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border-2 border-background">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {project.members.length + 1} {locale === 'vi' ? 'thành viên' : 'members'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectListCard({
  project,
  currentUser,
  getUserInitials,
  locale,
  dateLocale,
  onClick,
}: ProjectCardProps) {
  const isOwner = project.owner.id === currentUser?.id;
  const { taskStats, completionPercentage } = project;

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Icon with progress indicator */}
          <div className="relative">
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center"
              style={{
                background: `conic-gradient(hsl(${completionPercentage * 1.2}, 70%, 60%) ${completionPercentage}%, #e5e7eb ${completionPercentage}%)`,
              }}
            >
              <div className="h-10 w-10 rounded-md bg-white dark:bg-slate-900 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{project.name}</h3>
              {isOwner && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-600 border-orange-200"
                >
                  {locale === 'vi' ? 'Chủ sở hữu' : 'Owner'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {project.description || (locale === 'vi' ? 'Không có mô tả' : 'No description')}
            </p>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-bold">{taskStats.total}</div>
              <div className="text-[10px] text-muted-foreground">
                {locale === 'vi' ? 'Công việc' : 'Tasks'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{completionPercentage}%</div>
              <div className="text-[10px] text-muted-foreground">
                {locale === 'vi' ? 'Hoàn thành' : 'Complete'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{project.members.length + 1}</span>
            </div>
          </div>

          {/* Members */}
          <div className="hidden lg:flex -space-x-2">
            {[project.owner, ...project.members.filter((m) => m.id !== project.owner.id)]
              .slice(0, 3)
              .map((member, index) => (
                <Avatar
                  key={`${member.id}-${index}`}
                  className="h-8 w-8 border-2 border-background"
                >
                  <AvatarFallback className="text-xs bg-gradient-to-br from-orange-400 to-amber-500 text-white">
                    {getUserInitials(member)}
                  </AvatarFallback>
                </Avatar>
              ))}
          </div>

          {/* Date */}
          <div className="hidden xl:block text-right">
            <div className="text-xs text-muted-foreground">
              {locale === 'vi' ? 'Cập nhật' : 'Updated'}
            </div>
            <div className="text-sm">
              {format(parseISO(project.updated_at), "dd/MM/yyyy", { locale: dateLocale })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
