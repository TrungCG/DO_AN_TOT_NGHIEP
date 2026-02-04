"use client";

import { useState } from "react";
import { Settings, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
}

export function ProjectSettingsDialog({
  project,
  onUpdate,
}: ProjectSettingsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [isLoading, setIsLoading] = useState(false);

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
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác!",
      )
    )
      return;
    try {
      await projectService.delete(project.id);
      toast.success("Đã xóa dự án");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Lỗi xóa dự án");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm("Xóa thành viên này khỏi dự án?")) return;
    try {
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
              {project.members.map((member) => (
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
                    <span>{member.username}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div>
            <h3 className="font-medium text-red-600 mb-2">Vùng nguy hiểm</h3>
            <Button variant="destructive" onClick={handleDeleteProject}>
              <Trash2 className="w-4 h-4 mr-2" /> Xóa dự án
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
