"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";

export function AppSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/my-tasks", label: "Việc của tôi", icon: ListTodo },
    { href: "/profile", label: "Hồ sơ", icon: User },
  ];

  return (
    <div className="w-64 bg-card border-r h-screen flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center justify-between px-6 border-b">
        <div className="flex items-center">
          <FolderKanban className="h-6 w-6 text-blue-600 mr-2" />
          <span className="font-bold text-lg">Task Manager</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                pathname === link.href &&
                  "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700",
              )}
            >
              <link.icon className="mr-2 h-4 w-4" />
              {link.label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => {
            authService.logout();
            window.location.href = "/login";
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
