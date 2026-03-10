"use client";

import { useState } from "react";
import { Settings, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { projectService } from "@/services/project";
import { Project } from "@/types/project";

interface ProjectSettingsDialogProps {
  project: Project;
  onUpdate: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProjectSettingsDialog({
  project,
  onUpdate,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ProjectSettingsDialogProps) {
  const router = useRouter();
  const { getDisplayName } = useCurrentUser();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState<number | null>(null);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await projectService.update(project.id, { name, description });
      toast.success("Cập nhật dự án thành công");
      onUpdate();
      setOpen(false);
    } catch (error) {
      toast.error("Lỗi cập nhật dự án");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setShowDeleteProjectDialog(false);
      await projectService.delete(project.id);
      toast.success("Đã xóa dự án");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Lỗi xóa dự án");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      setShowRemoveMemberDialog(null);
      await projectService.removeMember(project.id, userId);
      toast.success("Đã xóa thành viên");
      onUpdate();
    } catch (error) {
      toast.error("Lỗi xóa thành viên");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Cài đặt dự án</DialogTitle>
          <DialogDescription>
            Quản lý thông tin và thành viên dự án.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên dự án</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button onClick={handleUpdate} disabled={isLoading}>
              Lưu thay đổi
            </Button>
          </div>

          <Separator />

          {/* Members */}
          <div>
            <h3 className="font-medium mb-4">
              Thành viên ({project.members.length})
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {project.members.map((member) => {
                const displayName = getDisplayName(member.id, member.username);
                return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {member.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{displayName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowRemoveMemberDialog(member.id)}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              );
              })}
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div>
            <h3 className="font-medium text-red-600 mb-2">Vùng nguy hiểm</h3>
            <Button variant="destructive" onClick={() => setShowDeleteProjectDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Xóa dự án
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={showDeleteProjectDialog} onOpenChange={setShowDeleteProjectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa dự án</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa dự án &quot;{project.name}&quot;? Tất cả công việc và dữ liệu liên quan sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa dự án
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={showRemoveMemberDialog !== null}
        onOpenChange={(open) => !open && setShowRemoveMemberDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa thành viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (showRemoveMemberDialog !== null) {
                  handleRemoveMember(showRemoveMemberDialog);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
