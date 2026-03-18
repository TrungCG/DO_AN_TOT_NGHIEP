"use client";

import { useState, useEffect } from "react";
import { cn, getAvatarColor } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Project } from "@/types/project";
import { 
  LayoutGrid, 
  List, 
  Calendar, 
  Clock, 
  FileText, 
  Users,
  Settings,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface JiraProjectHeaderProps {
  project: Project;
  activeTab: "board" | "list" | "calendar" | "timeline" | "summary";
  onTabChange: (tab: "board" | "list" | "calendar" | "timeline" | "summary") => void;
  onOpenSettings?: () => void;
  onAddMember?: () => void;
}

export function JiraProjectHeader({
  project,
  activeTab,
  onTabChange,
  onOpenSettings,
  onAddMember,
}: JiraProjectHeaderProps) {
  const { t } = useI18n();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
  const canAccessSettings = isAdmin || (currentUserId && Number(currentUserId) === Number(project.owner.id));
  
  const baseTabs = [
    { id: "board", label: t.project.board, icon: LayoutGrid },
    { id: "list", label: t.project.list, icon: List },
    { id: "calendar", label: t.project.calendar, icon: Calendar },
    { id: "timeline", label: t.project.timeline, icon: Clock },
  ] as const;

  // Only show summary tab for owner or admin
  const tabs = canAccessSettings
    ? [{ id: "summary", label: t.project.summary, icon: FileText }, ...baseTabs]
    : baseTabs;

  // Get all members including owner
  const allMembers = [project.owner, ...project.members].filter(
    (v, i, a) => a.findIndex((m) => m.id === v.id) === i
  );

  const getUserInitials = (user: { first_name?: string; last_name?: string; username: string }) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username[0].toUpperCase();
  };

  const getUserDisplayName = (user: { first_name?: string; last_name?: string; username: string }) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  return (
    <div className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {/* Project Info Row */}
      <div className="px-6 pt-4 pb-3">
        <div className="flex items-center justify-between">
          {/* Left: Breadcrumb + Project Name */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t.project.workspace}</span>
            <span className="text-gray-400">/</span>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold px-2"
              >
                {project.name.substring(0, 2).toUpperCase()}
              </Badge>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {project.name}
              </h1>
              
              {/* Members Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded" 
                    aria-label={t.project.members}
                    title={t.project.members}
                  >
                    <Users className="h-4 w-4 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2 py-1">
                      {t.project.members} ({allMembers.length})
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {allMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className={cn("text-xs text-white", getAvatarColor(member.id))}>
                              {getUserInitials(member)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {getUserDisplayName(member)}
                            </p>
                            {member.id === project.owner.id ? (
                              <p className="text-xs text-orange-600 dark:text-orange-400">{t.project.owner}</p>
                            ) : member.is_staff ? (
                              <p className="text-xs text-purple-600 dark:text-purple-400">{t.common.admin}</p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add Member Button */}
                    {canAccessSettings && onAddMember && (
                      <button
                        onClick={onAddMember}
                        className="w-full mt-2 flex items-center gap-2 px-2 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        {t.project.addMember}
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Settings Button - Only visible for owner/admin */}
              {canAccessSettings && (
                <button 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded" 
                  aria-label={t.project.settings}
                  title={t.project.settings}
                  onClick={onOpenSettings}
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap",
                "border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
