import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userApi } from "@/api";
import type { AuditLog } from "@/types";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { History, Search, User, Calendar } from "lucide-react";

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { strings, isRTL, language } = useI18n();

  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await userApi.getAuditLogs({
        ...filters,
        page,
        perPage: 20,
      });

      const data = Array.isArray(res) ? res : (res as any).logs || res;
      setLogs(data);
      // Mock total pages if not returned
      setTotalPages(10);
    } catch (error) {
      console.error("Failed to load audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-green-500/10 text-green-500";
    if (action.includes("UPDATE")) return "bg-blue-500/10 text-blue-500";
    if (action.includes("DELETE")) return "bg-red-500/10 text-red-500";
    if (action.includes("LOGIN")) return "bg-purple-500/10 text-purple-500";
    return "bg-gray-500/10 text-gray-500";
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            {strings.audit.title}
          </h1>
          <p className="text-muted-foreground mt-1">{strings.audit.subtitle}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={strings.audit.searchPlaceholder}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.entityType}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  entityType: v === "all" ? "" : v,
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue
                  placeholder={strings.audit.entityTypePlaceholder}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {strings.audit.entityTypeAll}
                </SelectItem>
                <SelectItem value="User">
                  {strings.audit.entityTypeUser}
                </SelectItem>
                <SelectItem value="Risk">
                  {strings.audit.entityTypeRisk}
                </SelectItem>
                <SelectItem value="TreatmentPlan">
                  {strings.audit.entityTypeTreatment}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.action}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  action: v === "all" ? "" : v,
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={strings.audit.actionPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{strings.audit.actionAll}</SelectItem>
                <SelectItem value="create">
                  {strings.audit.actionCreate}
                </SelectItem>
                <SelectItem value="update">
                  {strings.audit.actionUpdate}
                </SelectItem>
                <SelectItem value="delete">
                  {strings.audit.actionDelete}
                </SelectItem>
                <SelectItem value="login">
                  {strings.audit.actionLogin}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th
                  className={cn(
                    "p-4 text-sm font-medium text-muted-foreground w-[200px]",
                    isRTL ? "text-right" : "text-left"
                  )}
                >
                  {strings.audit.time}
                </th>
                <th
                  className={cn(
                    "p-4 text-sm font-medium text-muted-foreground w-[200px]",
                    isRTL ? "text-right" : "text-left"
                  )}
                >
                  {strings.audit.actor}
                </th>
                <th
                  className={cn(
                    "p-4 text-sm font-medium text-muted-foreground w-[150px]",
                    isRTL ? "text-right" : "text-left"
                  )}
                >
                  {strings.audit.action}
                </th>
                <th
                  className={cn(
                    "p-4 text-sm font-medium text-muted-foreground",
                    isRTL ? "text-right" : "text-left"
                  )}
                >
                  {strings.audit.details}
                </th>
                <th
                  className={cn(
                    "p-4 text-sm font-medium text-muted-foreground w-[150px]",
                    isRTL ? "text-right" : "text-left"
                  )}
                >
                  {strings.audit.entity}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      {strings.audit.loading}
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {strings.audit.empty}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td
                      className={cn(
                        "p-4 text-sm font-mono text-muted-foreground",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleString(
                          language === "ar" ? "ar-SA" : "en-GB",
                          { hour12: false }
                        )}
                      </div>
                    </td>
                    <td
                      className={cn(
                        "p-4 text-sm",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {log.actor}
                      </div>
                    </td>
                    <td
                      className={cn(
                        "p-4 text-sm",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-normal border-0",
                          getActionColor(log.action)
                        )}
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td
                      className={cn(
                        "p-4 text-sm text-foreground/80",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      {log.details}
                    </td>
                    <td
                      className={cn(
                        "p-4 text-sm",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      <Badge
                        variant="secondary"
                        className="font-normal text-xs"
                      >
                        {log.entityType}:{log.entityId}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            {strings.audit.prevPage}
          </Button>
          <span className="text-sm text-muted-foreground">
            {strings.audit.pageLabel.replace("{page}", String(page))}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading || logs.length < 20} // Simple check
          >
            {strings.audit.nextPage}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AuditLogPage;
