"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  Search,
  FolderKanban,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Project } from "@/types/project";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { RecentItem, getRecentItems, addRecentProject, clearRecentItems } from "@/lib/recent-items";
import { useI18n } from "@/lib/i18n";

interface RecentPopoverProps {
  projects: Project[];
}

const getItemLink = (item: RecentItem) => {
  if (item.type === "project") {
    const projectId = item.id.replace("project-", "");
    return `/projects/${projectId}`;
  }
  const taskId = item.id.replace("task-", "");
  if (item.projectId) {
    return `/projects/${item.projectId}?taskId=${taskId}`;
  }
  return `/my-tasks?taskId=${taskId}`;
};

// RecentSection component for popover
function RecentSectionPopover({ 
  title, 
  items,
  onClose,
  locale,
}: { 
  title: string; 
  items: RecentItem[];
  onClose: () => void;
  locale: "vi" | "en";
}) {
  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: locale === 'vi' ? vi : enUS });
    } catch {
      return "";
    }
  };

  if (items.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 mb-1">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={getItemLink(item)}
            onClick={onClose}
          >
            <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors">
              {item.type === "project" ? (
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded flex items-center justify-center">
                  <FolderKanban className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
              ) : (
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/40 rounded flex items-center justify-center">
                  <CheckSquare className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.type === "task" && item.projectName && (
                    <span className="mr-2">{item.projectName}</span>
                  )}
                  {formatTime(item.timestamp)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function RecentPopover({ projects }: RecentPopoverProps) {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const lastTrackedPath = useRef<string>("");

  const refreshRecentItems = useCallback(() => {
    setRecentItems(getRecentItems());
  }, []);

  // Load recent items after mount to avoid hydration mismatch
  useEffect(() => {
    setRecentItems(getRecentItems());
    setHasMounted(true);
  }, []);

  // Toggle expand/collapse
  const handleToggle = () => {
    if (!isExpanded) {
      refreshRecentItems();
    }
    setIsExpanded(!isExpanded);
  };

  // Open popover
  const handlePopoverOpen = (open: boolean) => {
    if (open) {
      refreshRecentItems();
    }
    setIsPopoverOpen(open);
  };

  // Track current page visit
  useEffect(() => {
    const projectMatch = pathname.match(/\/projects\/(\d+)/);
    if (projectMatch && pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = pathname;
      const projectId = parseInt(projectMatch[1]);
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        addRecentProject(projectId, project.name);
        if (isExpanded) {
          setTimeout(() => refreshRecentItems(), 0);
        }
      }
    }
  }, [pathname, projects, isExpanded, refreshRecentItems]);

  // Filter recent items for popover
  const filteredItems = recentItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by date for popover
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayItems = filteredItems.filter((item) => {
    const itemDate = new Date(item.timestamp);
    itemDate.setHours(0, 0, 0, 0);
    return itemDate.getTime() === today.getTime();
  });

  const yesterdayItems = filteredItems.filter((item) => {
    const itemDate = new Date(item.timestamp);
    itemDate.setHours(0, 0, 0, 0);
    return itemDate.getTime() === yesterday.getTime();
  });

  const olderItems = filteredItems.filter((item) => {
    const itemDate = new Date(item.timestamp);
    itemDate.setHours(0, 0, 0, 0);
    return itemDate.getTime() < yesterday.getTime();
  });

  const handlePopoverClose = () => setIsPopoverOpen(false);

  const handleClearHistory = () => {
    clearRecentItems();
    setRecentItems([]);
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true, 
        locale: locale === 'vi' ? vi : enUS 
      });
    } catch {
      return "";
    }
  };

  // Show first 3 items in sidebar
  const sidebarItems = recentItems.slice(0, 3);

  return (
    <div>
      {/* Header - click to expand/collapse */}
      <button
        onClick={handleToggle}
        className="flex items-center justify-between w-full px-2 mb-2 group"
      >
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-blue-500" />
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t.sidebar.recent}
          </p>
          {hasMounted && recentItems.length > 0 && (
            <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
              {recentItems.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>

      {/* Expanded content - show in sidebar */}
      {isExpanded && (
        <div className="space-y-1 mb-2">
          {sidebarItems.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 dark:text-slate-500">
              <Clock className="h-4 w-4" />
              <span>{t.sidebar.noRecentItems}</span>
            </div>
          ) : (
            <>
              {sidebarItems.map((item) => (
                <Link key={item.id} href={getItemLink(item)}>
                  <div className="flex items-start gap-2 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                    {item.type === "project" ? (
                      <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/40 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FolderKanban className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900/40 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckSquare className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {formatTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {/* "Xem tất cả" button opens popover */}
              {recentItems.length > 3 && (
                <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="px-3 py-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline w-full text-left">
                      {locale === "vi" ? "Xem tất cả" : "View all"} ({recentItems.length})
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-80 p-0 shadow-lg"
                    sideOffset={8}
                  >
                    <div className="p-3 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t.sidebar.recent}</h3>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder={t.sidebar.searchRecent}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-8 text-sm"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            title={t.sidebar.clearSearch}
                            aria-label={t.sidebar.clearSearch}
                          >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    <ScrollArea className="h-[400px]">
                      <div className="p-2">
                        {filteredItems.length === 0 ? (
                          <div className="text-center py-8 text-sm text-gray-500">
                            {searchQuery ? t.sidebar.noResults : t.sidebar.noRecentItems}
                          </div>
                        ) : (
                          <>
                            <RecentSectionPopover title={t.sidebar.today} items={todayItems} onClose={handlePopoverClose} locale={locale} />
                            <RecentSectionPopover title={t.sidebar.yesterday} items={yesterdayItems} onClose={handlePopoverClose} locale={locale} />
                            <RecentSectionPopover title={t.sidebar.earlier} items={olderItems} onClose={handlePopoverClose} locale={locale} />
                          </>
                        )}
                      </div>
                    </ScrollArea>

                    {filteredItems.length > 0 && (
                      <div className="p-2 border-t border-gray-200 dark:border-slate-700">
                        <button
                          onClick={handleClearHistory}
                          className="w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-1"
                        >
                          {t.sidebar.clearHistory}
                        </button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
