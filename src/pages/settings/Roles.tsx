import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/Loader";
import { userApi } from "@/api";
import type { BackendRole, BackendPermission } from "@/types/backend";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { Shield, Users, ChevronDown, ChevronUp } from "lucide-react";

interface RoleWithPermissions extends BackendRole {
  permissions: BackendPermission[];
}

const Roles: React.FC = () => {
  const { strings, isRTL } = useI18n();
  const [loading, setLoading] = React.useState(true);
  const [roles, setRoles] = React.useState<RoleWithPermissions[]>([]);
  const [expandedRoles, setExpandedRoles] = React.useState<Set<number>>(
    new Set()
  );

  React.useEffect(() => {
    const load = async () => {
      try {
        const rolesData = await userApi.getRoles();
        setRoles(rolesData as RoleWithPermissions[]);
      } catch (error) {
        console.error("Failed to load roles:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleExpand = (roleId: number) => {
    setExpandedRoles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // Group permissions by module.
  const groupPermissionsByModule = (permissions: BackendPermission[]) => {
    const groups: Record<string, BackendPermission[]> = {};
    permissions.forEach((p) => {
      const module = p.module || strings.permissions.moduleGeneral;
      if (!groups[module]) {
        groups[module] = [];
      }
      groups[module].push(p);
    });
    return groups;
  };

  if (loading) return <PageLoader text={strings.common.loading} />;

  return (
    <div className="space-y-6 animate-in">
      <div className={cn(isRTL ? "text-right" : "text-left")}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          {strings.roles.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {strings.roles.subtitle}
        </p>
      </div>

      <div className="grid gap-4">
        {roles.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                {strings.roles.noRoles}
              </p>
            </CardContent>
          </Card>
        ) : (
          roles.map((role) => {
            const isExpanded = expandedRoles.has(role.id);
            const permissionGroups = groupPermissionsByModule(
              role.permissions || []
            );
            const permissionCount = role.permissions?.length || 0;

            return (
              <Card key={role.id} className="glass-card">
                <CardHeader className="pb-3">
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3",
                      isRTL ? "flex-row-reverse" : ""
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {role.code}{" "}
                          {role.is_system && `• ${strings.roles.systemTag}`}{" "}
                          {role.is_default && `• ${strings.roles.defaultTag}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {permissionCount} {strings.roles.permissionLabel}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(role.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-4">
                    {role.description && (
                      <p className="text-sm text-muted-foreground border-t border-border pt-3">
                        {role.description}
                      </p>
                    )}

                    {permissionCount === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {strings.roles.noPermissions}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(permissionGroups).map(
                          ([module, perms]) => (
                            <div key={module} className="space-y-2">
                              <h4 className="text-sm font-medium text-muted-foreground">
                                {module}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {perms.map((p) => (
                                  <Badge
                                    key={p.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {p.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Roles;
