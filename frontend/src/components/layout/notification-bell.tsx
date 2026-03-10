"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { notificationService } from "@/services/extra";
import { Notification } from "@/types/extra";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function NotificationBell() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const dateLocale = locale === "vi" ? vi : enUS;

  // Translate notification content based on locale
  const translateNotification = (notification: Notification) => {
    let title = notification.title;
    let message = notification.message;

    if (locale === "en") {
      // Translate title patterns
      if (title === "Bạn được giao một công việc mới") {
        title = t.notification.newTaskAssigned;
      } else if (title.startsWith("Bình luận mới trong công việc")) {
        // Extract task name from "Bình luận mới trong công việc 'taskName'"
        const taskMatch = title.match(/Bình luận mới trong công việc '(.+)'/);
        if (taskMatch) {
          title = `${t.notification.newComment} '${taskMatch[1]}'`;
        }
      }

      // Translate message patterns
      // Pattern: "Bạn vừa được {user} giao công việc '{task}' trong dự án '{project}'."
      const assignMatch = message.match(/Bạn vừa được (.+) giao công việc '(.+)' trong dự án '(.+)'\./);
      if (assignMatch) {
        message = t.notification.assignedTaskMessage
          .replace("{user}", assignMatch[1])
          .replace("{task}", assignMatch[2])
          .replace("{project}", assignMatch[3]);
      }

      // Pattern: "{user} đã bình luận: "{comment}""
      const commentMatch = message.match(/(.+) đã bình luận: "(.+)"/);
      if (commentMatch) {
        message = t.notification.commentMessage
          .replace("{user}", commentMatch[1])
          .replace("{comment}", commentMatch[2]);
      }
    }

    return { title, message };
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setNotifications([]);
      toast.error(t.notification.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (error) {
      console.error(error);
      toast.error(t.notification.markReadError);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success(t.notification.markedAllRead);
    } catch (error) {
      console.error(error);
      toast.error(t.notification.markAllError);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.project) {
      setOpen(false);
      // If there's a task, add taskId to query params to auto-open it
      if (notification.task) {
        router.push(`/projects/${notification.project}?taskId=${notification.task}`);
      } else {
        router.push(`/projects/${notification.project}`);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{t.notification.title}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={handleMarkAllAsRead}
            >
              {t.notification.markAllRead}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t.notification.loading}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {t.notification.noNotifications}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const { title, message } = translateNotification(notification);
                return (
                <button
                  key={notification.id}
                  className={cn(
                    "w-full p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer",
                    !notification.is_read &&
                      "bg-blue-50/50 dark:bg-blue-950/20",
                    notification.project && "hover:shadow-md"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                  disabled={!notification.project}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-1 h-2 w-2 rounded-full flex-shrink-0",
                        notification.is_read ? "bg-transparent" : "bg-blue-600",
                      )}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-sm">
                        {title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {message}
                      </p>
                      {(notification.project_name ||
                        notification.task_title) && (
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          {notification.project_name && (
                            <span className="font-semibold text-foreground">📁 {notification.project_name}</span>
                          )}
                          {notification.task_title && (
                            <span className="font-semibold text-foreground">✓ {notification.task_title}</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          {
                            addSuffix: true,
                            locale: dateLocale,
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              );})}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
