import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageLoader } from "@/components/common/Loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/authContext";
import { useI18n } from "@/i18n";
import { userApi } from "@/api";
import type { BackendRole, BackendPermission } from "@/types/backend";
import { Save, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleWithPermissions extends BackendRole {
  permissions: BackendPermission[];
}

const Permissions: React.FC = () => {
  const { toast } = useToast();
  const { can } = useAuth();
  const { strings, isRTL } = useI18n();

  const canManage = can("canViewSettings");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<number | null>(null);
  const [roles, setRoles] = React.useState<RoleWithPermissions[]>([]);
  const [allPermissions, setAllPermissions] = React.useState<
    BackendPermission[]
  >([]);
  const [rolePermissions, setRolePermissions] = React.useState<
    Record<number, Set<number>>
  >({});

  React.useEffect(() => {
    const load = async () => {
      try {
        const [rolesData, permissionsData] = await Promise.all([
          userApi.getRoles(),
          userApi.getPermissions(),
        ]);

        setRoles(rolesData as RoleWithPermissions[]);
        setAllPermissions(permissionsData);

        // Build permissions map per role.
        const permMap: Record<number, Set<number>> = {};
        (rolesData as RoleWithPermissions[]).forEach((role) => {
          permMap[role.id] = new Set((role.permissions || []).map((p) => p.id));
        });
        setRolePermissions(permMap);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: strings.permissions.loadFailedTitle,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  // Group permissions by module.
  const permissionsByModule = React.useMemo(() => {
    const groups: Record<string, BackendPermission[]> = {};
    allPermissions.forEach((p) => {
      const module = p.module || strings.permissions.moduleGeneral;
      if (!groups[module]) {
        groups[module] = [];
      }
      groups[module].push(p);
    });
    return groups;
  }, [allPermissions]);

  const togglePermission = (roleId: number, permissionId: number) => {
    setRolePermissions((prev) => {
      const rolePerms = new Set(prev[roleId] || []);
      if (rolePerms.has(permissionId)) {
        rolePerms.delete(permissionId);
      } else {
        rolePerms.add(permissionId);
      }
      return { ...prev, [roleId]: rolePerms };
    });
  };

  const saveRolePermissions = async (roleId: number) => {
    if (!canManage) {
      toast({ title: strings.common.notAllowed, variant: "destructive" });
      return;
    }

    setSaving(roleId);
    try {
      const permissionIds = Array.from(rolePermissions[roleId] || []);
      await userApi.updateRolePermissions(roleId, permissionIds);
      toast({ title: strings.permissions.saved });
    } catch (error) {
      console.error("Failed to save permissions:", error);
      toast({
        title: strings.permissions.saveFailedTitle,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <PageLoader text={strings.common.loading} />;

  if (!canManage) {
    return (
      <div className="space-y-6 animate-in">
        <h1
          className={cn(
            "text-2xl font-bold",
            isRTL ? "text-right" : "text-left"
          )}
        >
          {strings.permissions.title}
        </h1>
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {strings.permissions.accessDenied}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {strings.permissions.title}
          </h1>
          <p className="text-muted-foreground">
            {strings.permissions.subtitle}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {roles.map((role) => {
          const originalPerms = new Set(
            (role.permissions || []).map((p) => p.id)
          );
          const currentPerms = rolePermissions[role.id] || new Set();
          const hasChanges =
            originalPerms.size !== currentPerms.size ||
            [...originalPerms].some((id) => !currentPerms.has(id));

          return (
            <Card key={role.id} className="glass-card">
              <CardHeader className="pb-3">
                <div
                  className={cn(
                    "flex items-center justify-between gap-3",
                    isRTL ? "flex-row-reverse" : ""
                  )}
                >
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {role.code}{" "}
                      {role.is_system && `• ${strings.roles.systemTag}`}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => saveRolePermissions(role.id)}
                    disabled={!hasChanges || saving === role.id}
                  >
                    <Save className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                    {saving === role.id
                      ? strings.permissions.saving
                      : strings.actions.save}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module} className="space-y-3">
                    <h4 className="text-sm font-medium text-primary border-b border-border pb-1">
                      {module}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {perms.map((permission) => {
                        const isChecked =
                          rolePermissions[role.id]?.has(permission.id) || false;
                        return (
                          <div
                            key={permission.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg border border-border/50 hover:border-primary/30 transition-colors",
                              isRTL ? "flex-row-reverse" : ""
                            )}
                          >
                            <Checkbox
                              id={`${role.id}-${permission.id}`}
                              checked={isChecked}
                              onCheckedChange={() =>
                                togglePermission(role.id, permission.id)
                              }
                            />
                            <label
                              htmlFor={`${role.id}-${permission.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <p className="text-sm font-medium">
                                {permission.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {permission.code}
                              </p>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Permissions;
