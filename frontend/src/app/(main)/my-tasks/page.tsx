"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { taskService } from "@/services/task";
import { userService } from "@/services/user";
import { Task } from "@/types/task";
import { User } from "@/types/auth";
import { CreateTaskDialog } from "@/components/project/create-task-dialog";
import { JiraBoard, JiraListView, JiraCalendarView, JiraTimelineView, MyTasksHeader } from "@/components/project/jira-board";
import { PersonalTasksOverview } from "@/components/project/personal-tasks-overview";
import { useI18n } from "@/lib/i18n";

function MyTasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"board" | "list" | "calendar" | "timeline" | "summary">("board");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { t } = useI18n();

  const fetchData = async () => {
    try {
      const [tasksData, userData] = await Promise.all([
        taskService.getPersonal(),
        userService.getCurrentUser(),
      ]);
      setAllTasks(tasksData);
      setCurrentUser(userData);
    } catch (error) {
      console.error(error);
      toast.error(t.messages.error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const members: User[] = currentUser ? [currentUser] : [];

  return (
    <div className="h-full flex flex-col">
      {/* My Tasks Header with Tabs */}
      <MyTasksHeader
        taskCount={allTasks.length}
        totalCount={allTasks.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreateTask={() => setIsCreateDialogOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50 dark:bg-slate-950 px-6 py-4 overflow-auto">
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
          allTasks.length > 0 ? (
            <JiraBoard
              projectId={-1}
              projectKey="ME"
              projectName={t.dashboard.personalTasks}
              initialTasks={allTasks}
              onTaskUpdate={fetchData}
              members={members}
              ownerId={currentUser?.id}
              selectedTask={selectedTask}
              onSelectTask={setSelectedTask}
              onCreateTask={() => setIsCreateDialogOpen(true)}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {t.task.noTasks}
              </p>
              <CreateTaskDialog projectId={-1} onSuccess={fetchData} />
            </div>
          )
        )}

        {activeTab === "summary" && (
          <PersonalTasksOverview tasks={allTasks} />
        )}

        {activeTab === "list" && (
          <JiraListView
            projectId={-1}
            projectKey="ME"
            projectName={t.dashboard.personalTasks}
            tasks={allTasks}
            members={members}
            ownerId={currentUser?.id}
            onTaskUpdate={fetchData}
            onCreateTask={() => setIsCreateDialogOpen(true)}
          />
        )}

        {activeTab === "calendar" && (
          <JiraCalendarView
            projectId={-1}
            projectKey="ME"
            projectName={t.dashboard.personalTasks}
            tasks={allTasks}
            members={members}
            ownerId={currentUser?.id}
            onTaskUpdate={fetchData}
          />
        )}

        {activeTab === "timeline" && (
          <JiraTimelineView
            projectId={-1}
            projectKey="ME"
            projectName={t.dashboard.personalTasks}
            tasks={allTasks}
            members={members}
            ownerId={currentUser?.id}
            onTaskUpdate={fetchData}
          />
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog 
        projectId={-1} 
        onSuccess={fetchData}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}

export default function MyTasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <MyTasksContent />
    </Suspense>
  );
}