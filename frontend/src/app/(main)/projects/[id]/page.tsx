"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, Filter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectService } from "@/services/project";
import { taskService } from "@/services/task";
import { Project } from "@/types/project";
import { Task } from "@/types/task";
import { User } from "@/types/auth";
import { CreateTaskDialog } from "@/components/project/create-task-dialog";
import { KanbanBoard } from "@/components/project/kanban-board";
import { AddMemberDialog } from "@/components/project/add-member-dialog";
import { ProjectSettingsDialog } from "@/components/project/project-settings-dialog";
import { ProjectActivityDialog } from "@/components/project/project-activity-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");

  const fetchData = async () => {
    try {
      const [projectData, tasksData] = await Promise.all([
        projectService.getById(projectId),
        taskService.getByProject(projectId),
      ]);
      setProject(projectData);
      setTasks(tasksData);
      setFilteredTasks(tasksData);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thông tin dự án.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  // Apply filters
  useEffect(() => {
    let result = tasks;

    if (search) {
      result = result.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (priorityFilter !== "ALL") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (assigneeFilter !== "ALL") {
      if (assigneeFilter === "UNASSIGNED") {
        result = result.filter((t) => !t.assignee);
      } else {
        result = result.filter(
          (t) => t.assignee?.id.toString() === assigneeFilter,
        );
      }
    }

    setFilteredTasks(result);
  }, [tasks, search, priorityFilter, assigneeFilter]);

  if (isLoading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Dự án không tồn tại</div>;
  }

  const allMembers: User[] = [project.owner, ...project.members].filter(
    (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 space-y-4">
        {/* Top Row: Back & Title */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                {project.name}
              </h1>
              <div className="flex gap-1">
                <ProjectSettingsDialog project={project} onUpdate={fetchData} />
                <ProjectActivityDialog projectId={projectId} />
              </div>
            </div>
            <p className="text-muted-foreground mt-2">{project.description}</p>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex -space-x-2">
                {project.members.map((member) => (
                  <Avatar
                    key={member.id}
                    className="border-2 border-white w-8 h-8"
                  >
                    <AvatarFallback className="text-xs">
                      {member.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                <Avatar className="border-2 border-white w-8 h-8 bg-gray-100">
                  <AvatarFallback className="text-xs">
                    +{project.members.length}
                  </AvatarFallback>
                </Avatar>
              </div>
              <AddMemberDialog projectId={projectId} onSuccess={fetchData} />
            </div>
          </div>
          <CreateTaskDialog projectId={projectId} onSuccess={fetchData} />
        </div>

        {/* Bottom Row: Filters */}
        <div className="flex gap-4 items-center bg-card p-3 rounded-lg border shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm công việc..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Độ ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả độ ưu tiên</SelectItem>
              <SelectItem value="HIGH">Cao</SelectItem>
              <SelectItem value="MED">Trung bình</SelectItem>
              <SelectItem value="LOW">Thấp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Thành viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả thành viên</SelectItem>
              <SelectItem value="UNASSIGNED">Chưa giao</SelectItem>
              {allMembers.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setPriorityFilter("ALL");
              setAssigneeFilter("ALL");
            }}
          >
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        projectId={projectId}
        initialTasks={filteredTasks}
        onTaskUpdate={fetchData}
        members={allMembers}
      />
    </div>
  );
}
