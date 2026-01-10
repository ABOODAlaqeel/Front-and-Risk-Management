/**
 * NotificationBell - Notification bell component.
 *
 * Shows unread count and a dropdown with recent notifications.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationApi } from "@/api";
import type { Notification, NotificationPriority } from "@/api/notificationApi";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

// ===========================================
// Helper Functions
// ===========================================

const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case "critical":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "review_reminder":
      return "📅";
    case "risk_escalation":
      return "⚠️";
    case "appetite_exceeded":
      return "🔴";
    case "treatment_due":
      return "📋";
    case "system_alert":
      return "🔔";
    case "committee_decision":
      return "👥";
    default:
      return "📌";
  }
};

const formatTimeAgo = (
  dateStr: string,
  locale: string,
  strings: {
    timeAgoNow: string;
    timeAgoMinutes: string;
    timeAgoHours: string;
    timeAgoDays: string;
  }
) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return strings.timeAgoNow;
  if (diffMins < 60) {
    return strings.timeAgoMinutes.replace("{count}", String(diffMins));
  }
  if (diffHours < 24) {
    return strings.timeAgoHours.replace("{count}", String(diffHours));
  }
  if (diffDays < 7) {
    return strings.timeAgoDays.replace("{count}", String(diffDays));
  }
  return date.toLocaleDateString(locale);
};

// ===========================================
// Component
// ===========================================

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { isRTL, language, strings } = useI18n();
  const locale = language === "ar" ? "ar-SA" : "en-US";

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const fetchNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getNotifications({ limit: 10 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationApi.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);
  React.useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);
  const handleMarkAsRead = async (
    e: React.MouseEvent,
    notification: Notification
  ) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      notificationApi.markAsRead(notification.id).catch(console.error);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={strings.notificationsBell.ariaLabel}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isRTL ? "start" : "end"}
        className="w-80 md:w-96"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-bold">{strings.notificationsBell.title}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
              {strings.notificationsBell.markAllRead}
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p>{strings.notificationsBell.empty}</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start p-3 cursor-pointer",
                  !notification.is_read && "bg-accent/50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3 w-full">
                  {/* Icon & Priority */}
                  <div className="relative flex-shrink-0">
                    <span className="text-xl">
                      {getTypeIcon(notification.type)}
                    </span>
                    <div
                      className={cn(
                        "absolute -bottom-1 -right-1 w-2 h-2 rounded-full",
                        getPriorityColor(notification.priority)
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm truncate",
                          !notification.is_read && "font-semibold"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(notification.created_at, locale, strings.notificationsBell)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleMarkAsRead(e, notification)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="justify-center text-primary cursor-pointer"
          onClick={() => {
            navigate("/notifications");
            setOpen(false);
          }}
        >
          <ExternalLink className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {strings.notificationsBell.viewAll}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
