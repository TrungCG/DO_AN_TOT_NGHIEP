"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { toast } from "sonner";

import { projectService } from "@/services/project";
import { taskService } from "@/services/task";
import { Project } from "@/types/project";
import { Task } from "@/types/task";
import { User } from "@/types/auth";
import { CreateTaskDialog } from "@/components/project/create-task-dialog";
import { JiraBoard, JiraProjectHeader, JiraListView, JiraCalendarView, JiraTimelineView } from "@/components/project/jira-board";
import { MemberTasksBoard } from "@/components/project/member-tasks-board";
import { ProjectOverview } from "@/components/project/project-overview";
import { AddMemberDialog } from "@/components/project/add-member-dialog";
import { ProjectSettingsDialog } from "@/components/project/project-settings-dialog";
import { ProjectActivityDialog } from "@/components/project/project-activity-dialog";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function ProjectDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"board" | "list" | "calendar" | "timeline" | "summary">("board");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { t } = useI18n();

  // Get current user info from token
  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.user_id);
        setIsAdmin(payload.is_staff || false);
      }
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }, []);

  // Check if current user can access settings (owner or admin)
  const canAccessSettings = isAdmin || (currentUserId && project && Number(currentUserId) === Number(project.owner.id));

  // Redirect to board if user doesn't have permission to view summary tab
  useEffect(() => {
    if (activeTab === "summary" && !canAccessSettings && project && currentUserId !== null) {
      setActiveTab("board");
    }
  }, [activeTab, canAccessSettings, project, currentUserId]);

  const fetchData = async () => {
    try {
      const [projectData, tasksData] = await Promise.all([
        projectService.getById(projectId),
        taskService.getByProject(projectId),
      ]);
      setProject(projectData);
      setAllTasks(tasksData);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thông tin dự án.");
    } finally {
      setIsLoading(false);
    }
  };

  // Optimistic update handlers for immediate UI updates
  const handleTaskUpdated = (updatedTask: Task) => {
    setAllTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDeleted = (taskId: number) => {
    setAllTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  // Check for taskId in query params to auto-open task
  useEffect(() => {
    const taskIdParam = searchParams.get("taskId");
    if (taskIdParam) {
      const taskId = Number(taskIdParam);
      const task = allTasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedTask(task);
      }
    }
  }, [searchParams, allTasks]);

  if (isLoading) {
    return <div className="p-8 text-center">{t.common.loading}</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">{t.common.noData}</div>;
  }

  const allMembers: User[] = [project.owner, ...project.members].filter(
    (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
  );

  // Generate project key from project name (first 2-4 letters uppercase)
  const projectKey = project.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 4) || "PROJ";

  return (
    <div className="h-full flex flex-col">
      {/* Jira-style Project Header with Tabs */}
      <JiraProjectHeader
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddMember={() => setIsAddMemberOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50 dark:bg-slate-950 px-6 py-4">
        {/* Back Button - Small */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft className="h-3 w-3" />
          {t.common.back}
        </button>

        {/* Tab Content */}
        {activeTab === "board" && (
          <JiraBoard
            projectId={projectId}
            projectKey={projectKey}
            projectName={project.name}
            initialTasks={allTasks}
            onTaskUpdate={fetchData}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            members={allMembers}
            ownerId={project?.owner?.id}
            selectedTask={selectedTask}
            onSelectTask={setSelectedTask}
            onCreateTask={() => setIsCreateDialogOpen(true)}
          />
        )}

        {activeTab === "summary" && (
          <div className="space-y-6">
            <ProjectOverview 
              tasks={allTasks} 
              members={allMembers} 
              canViewMemberProgress={canAccessSettings}
            />
            
            {/* Settings and Activity buttons */}
            <div className="flex gap-2">
              {canAccessSettings && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              )}
              <ProjectActivityDialog projectId={projectId} />
              {canAccessSettings && (
                <AddMemberDialog projectId={projectId} onSuccess={fetchData} />
              )}
            </div>
          </div>
        )}

        {activeTab === "list" && (
          <JiraListView
            projectId={projectId}
            projectKey={projectKey}
            projectName={project.name}
            tasks={allTasks}
            members={allMembers}
            ownerId={project?.owner?.id}
            onTaskUpdate={fetchData}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            onCreateTask={() => setIsCreateDialogOpen(true)}
          />
        )}

        {activeTab === "calendar" && (
          <JiraCalendarView
            projectId={projectId}
            projectKey={projectKey}
            projectName={project.name}
            tasks={allTasks}
            members={allMembers}
            ownerId={project?.owner?.id}
            onTaskUpdate={fetchData}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
        )}

        {activeTab === "timeline" && (
          <JiraTimelineView
            projectId={projectId}
            projectKey={projectKey}
            projectName={project.name}
            tasks={allTasks}
            members={allMembers}
            ownerId={project?.owner?.id}
            onTaskUpdate={fetchData}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        projectId={projectId}
        onSuccess={fetchData}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Project Settings Dialog - Only for owner/admin */}
      {canAccessSettings && (
        <ProjectSettingsDialog
          project={project}
          onUpdate={fetchData}
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      )}

      {/* Add Member Dialog - Only for owner/admin */}
      {canAccessSettings && (
        <AddMemberDialog
          projectId={projectId}
          onSuccess={fetchData}
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
        />
      )}
    </div>
  );
}
