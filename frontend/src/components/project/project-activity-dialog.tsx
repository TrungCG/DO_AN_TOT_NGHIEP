"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useCurrentUser } from "@/hooks/use-current-user";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { projectService } from "@/services/project";
import { ActivityLog } from "@/types/extra";

interface ProjectActivityDialogProps {
  projectId: number;
}

export function ProjectActivityDialog({
  projectId,
}: ProjectActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const { getDisplayName } = useCurrentUser();

  const fetchLogs = async () => {
    try {
      const data = await projectService.getActivity(projectId);
      setLogs(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (val) fetchLogs();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Activity className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lịch sử hoạt động dự án</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 text-sm">
                <div className="font-semibold min-w-[80px]">
                  {log.actor ? getDisplayName(log.actor.id, log.actor.username) : "Hệ thống"}
                </div>
                <div className="flex-1">
                  {log.action_description}
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(log.timestamp), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
