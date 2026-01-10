/**
 * NotificationsPage - Notifications center page.
 *
 * View and manage all notifications.
 */
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/common/Loader";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n";
import { notificationApi } from "@/api";
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  ScheduledJob,
} from "@/api/notificationApi";
import { cn } from "@/lib/utils";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  MoreVertical,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  Play,
  Settings,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ===========================================
// Helper Functions
// ===========================================

const getTypeLabel = (
  type: NotificationType,
  labels: Record<NotificationType, string>
): string => labels[type] || type;

const getTypeColor = (type: NotificationType): string => {
  const colors: Record<NotificationType, string> = {
    review_reminder: "bg-blue-100 text-blue-800",
    risk_escalation: "bg-red-100 text-red-800",
    appetite_exceeded: "bg-orange-100 text-orange-800",
    treatment_due: "bg-yellow-100 text-yellow-800",
    assessment_required: "bg-purple-100 text-purple-800",
    system_alert: "bg-gray-100 text-gray-800",
    committee_decision: "bg-green-100 text-green-800",
    general: "bg-slate-100 text-slate-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
};

const getPriorityBadge = (
  priority: NotificationPriority,
  labels: Record<NotificationPriority, string>
) => {
  const config: Record<
    NotificationPriority,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    critical: { label: labels.critical, variant: "destructive" },
    high: { label: labels.high, variant: "default" },
    medium: { label: labels.medium, variant: "secondary" },
    low: { label: labels.low, variant: "outline" },
  };
  const c = config[priority] || {
    label: priority,
    variant: "secondary" as const,
  };
  return <Badge variant={c.variant}>{c.label}</Badge>;
};

const formatDate = (dateStr: string, locale: string) => {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ===========================================
// Component
// ===========================================

const NotificationsPage: React.FC = () => {
  const { strings, language } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const typeLabels = strings.notificationsPage.types;
  const priorityLabels = strings.notificationsPage.priorities;
  const locale = language === "ar" ? "ar-SA" : "en-US";

  // State
  const [loading, setLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [scheduledJobs, setScheduledJobs] = React.useState<ScheduledJob[]>([]);

  // Filters
  const [activeTab, setActiveTab] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // ===========================================
  // Data Fetching
  // ===========================================

  const fetchNotifications = React.useCallback(async () => {
    try {
      const params: { unread_only?: boolean; type?: NotificationType } = {};

      if (activeTab === "unread") {
        params.unread_only = true;
      }

      if (typeFilter !== "all") {
        params.type = typeFilter as NotificationType;
      }

      const data = await notificationApi.getNotifications({
        ...params,
        limit: 100,
      });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast({
        title: strings.notificationsPage.toast.errorTitle,
        description: strings.notificationsPage.toast.loadFailed,
        variant: "destructive",
      });
    }
  }, [activeTab, typeFilter, toast]);

  const fetchScheduledJobs = React.useCallback(async () => {
    try {
      const jobs = await notificationApi.getScheduledJobs();
      setScheduledJobs(jobs);
    } catch (error) {
      console.error("Failed to fetch scheduled jobs:", error);
    }
  }, []);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchNotifications(), fetchScheduledJobs()]);
    setLoading(false);
  }, [fetchNotifications, fetchScheduledJobs]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ===========================================
  // Actions
  // ===========================================

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await notificationApi.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast({
        title: strings.common.done,
        description: strings.notificationsPage.toast.markedRead,
      });
    } catch (error) {
      toast({
        title: strings.notificationsPage.toast.errorTitle,
        description: strings.notificationsPage.toast.updateFailed,
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const count = await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast({
        title: strings.common.done,
        description: strings.notificationsPage.toast.markedReadMany.replace(
          "{count}",
          String(count)
        ),
      });
    } catch (error) {
      toast({
        title: strings.notificationsPage.toast.errorTitle,
        description: strings.notificationsPage.toast.updateManyFailed,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (notification: Notification) => {
    try {
      await notificationApi.deleteNotification(notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      if (!notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast({
        title: strings.common.done,
        description: strings.notificationsPage.toast.deleteSuccess,
      });
    } catch (error) {
      toast({
        title: strings.notificationsPage.toast.errorTitle,
        description: strings.notificationsPage.toast.deleteFailed,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const count = await notificationApi.deleteAllRead();
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      toast({
        title: strings.common.done,
        description: strings.notificationsPage.toast.deleteManySuccess.replace(
          "{count}",
          String(count)
        ),
      });
    } catch (error) {
      toast({
        title: strings.notificationsPage.toast.errorTitle,
        description: strings.notificationsPage.toast.deleteManyFailed,
        variant: "destructive",
      });
    }
  };

  const handleRunJob = async (jobId: string) => {
    try {
      await notificationApi.runJobNow(jobId);
      toast({
        title: strings.common.done,
        description: strings.notificationsPage.toast.jobRunSuccess,
      });
      setTimeout(fetchScheduledJobs, 2000);
    } catch (error) {
      toast({
        title: strings.notificationsPage.toast.errorTitle,
        description: strings.notificationsPage.toast.jobRunFailed,
        variant: "destructive",
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      notificationApi.markAsRead(notification.id).catch(console.error);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  // Filter notifications by search
  const filteredNotifications = React.useMemo(() => {
    if (!searchQuery) return notifications;
    const query = searchQuery.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  // ===========================================
  // Render
  // ===========================================

  if (loading) {
    return <PageLoader text={strings.common.loading} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6" />
          {strings.notificationsPage.title}
        </h1>
        <p className="text-muted-foreground">
          {strings.notificationsPage.subtitle}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {strings.notificationsPage.total}
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {strings.notificationsPage.unread}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {unreadCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {strings.notificationsPage.scheduledJobs}
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledJobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {strings.notificationsPage.read}
            </CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {totalCount - unreadCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            {strings.notificationsPage.tabs.all} ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="unread">
            {strings.notificationsPage.tabs.unread} ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="scheduler">
            {strings.notificationsPage.tabs.scheduler}
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="all" className="space-y-4">
          <NotificationsTable
            notifications={filteredNotifications}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDelete={handleDelete}
            onDeleteAllRead={handleDeleteAllRead}
            onClick={handleNotificationClick}
            onRefresh={fetchNotifications}
            unreadCount={unreadCount}
          />
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <NotificationsTable
            notifications={filteredNotifications}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDelete={handleDelete}
            onDeleteAllRead={handleDeleteAllRead}
            onClick={handleNotificationClick}
            onRefresh={fetchNotifications}
            unreadCount={unreadCount}
          />
        </TabsContent>

        {/* Scheduler Tab */}
        <TabsContent value="scheduler" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {strings.notificationsPage.schedulerTitle}
                </CardTitle>
                <CardDescription>
                  {strings.notificationsPage.schedulerSubtitle}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchScheduledJobs}>
                <RefreshCw className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {strings.notificationsPage.refresh}
              </Button>
            </CardHeader>
            <CardContent>
              {scheduledJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{strings.notificationsPage.noJobs}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{strings.notificationsPage.table.id}</TableHead>
                        <TableHead>{strings.notificationsPage.table.name}</TableHead>
                        <TableHead>{strings.notificationsPage.table.trigger}</TableHead>
                        <TableHead>
                          {strings.notificationsPage.table.nextRun}
                        </TableHead>
                        <TableHead className="w-[100px]">
                          {strings.notificationsPage.table.actions}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-sm">
                            {job.id}
                          </TableCell>
                          <TableCell>{job.name}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {job.trigger}
                          </TableCell>
                          <TableCell>
                            {job.next_run ? formatDate(job.next_run, locale) : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRunJob(job.id)}
                            >
                              <Play className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                              {strings.notificationsPage.run}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ===========================================
// Notifications Table Sub-Component
// ===========================================

interface NotificationsTableProps {
  notifications: Notification[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  onMarkAsRead: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onDelete: (notification: Notification) => void;
  onDeleteAllRead: () => void;
  onClick: (notification: Notification) => void;
  onRefresh: () => void;
  unreadCount: number;
}

const NotificationsTable: React.FC<NotificationsTableProps> = ({
  notifications,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAllRead,
  onClick,
  onRefresh,
  unreadCount,
}) => {
  const { strings, language } = useI18n();
  const typeLabels = strings.notificationsPage.types;
  const priorityLabels = strings.notificationsPage.priorities;
  const locale = language === "ar" ? "ar-SA" : "en-US";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={strings.notificationsPage.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[200px]"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              <SelectValue
                placeholder={strings.notificationsPage.typePlaceholder}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {strings.notificationsPage.allTypes}
              </SelectItem>
              <SelectItem value="review_reminder">
                {strings.notificationsPage.types.review_reminder}
              </SelectItem>
              <SelectItem value="risk_escalation">
                {strings.notificationsPage.types.risk_escalation}
              </SelectItem>
              <SelectItem value="appetite_exceeded">
                {strings.notificationsPage.types.appetite_exceeded}
              </SelectItem>
              <SelectItem value="treatment_due">
                {strings.notificationsPage.types.treatment_due}
              </SelectItem>
              <SelectItem value="system_alert">
                {strings.notificationsPage.types.system_alert}
              </SelectItem>
              <SelectItem value="committee_decision">
                {strings.notificationsPage.types.committee_decision}
              </SelectItem>
              <SelectItem value="general">
                {strings.notificationsPage.types.general}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {strings.notificationsPage.markAllRead}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onDeleteAllRead}>
            <Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {strings.notificationsPage.deleteRead}
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">{strings.notificationsPage.emptyTitle}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>{strings.notificationsPage.columns.title}</TableHead>
                  <TableHead>{strings.notificationsPage.columns.type}</TableHead>
                  <TableHead>
                    {strings.notificationsPage.columns.priority}
                  </TableHead>
                  <TableHead>{strings.notificationsPage.columns.date}</TableHead>
                  <TableHead className="w-[80px]">
                    {strings.notificationsPage.columns.actions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={cn(
                      "cursor-pointer hover:bg-accent/50",
                      !notification.is_read && "bg-accent/30"
                    )}
                    onClick={() => onClick(notification)}
                  >
                    <TableCell>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p
                          className={cn(
                            "font-medium",
                            !notification.is_read && "font-bold"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {notification.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getTypeColor(notification.type)}
                        variant="outline"
                      >
                        {getTypeLabel(notification.type, typeLabels)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(notification.priority, priorityLabels)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(notification.created_at, locale)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.is_read && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification);
                              }}
                            >
                              <Check className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                              {strings.notificationsPage.actions.markRead}
                            </DropdownMenuItem>
                          )}
                          {notification.action_url && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onClick(notification);
                              }}
                            >
                              <ExternalLink className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                              {strings.notificationsPage.actions.viewDetails}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(notification);
                            }}
                          >
                            <Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                            {strings.notificationsPage.actions.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationsPage;
