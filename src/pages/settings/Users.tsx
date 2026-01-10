import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/common/Loader";
import { Can, PermissionDenied } from "@/components/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { userApi } from "@/api";
import type { User } from "@/types";
import type { BackendRole } from "@/types/backend";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";

type EditUser = Pick<User, "id" | "name" | "email" | "role">;

const Users: React.FC = () => {
  const { strings, isRTL } = useI18n();
  const { toast } = useToast();
  const { canManageUsers } = usePermissions();

  const [loading, setLoading] = React.useState(true);
  const [users, setUsers] = React.useState<User[]>([]);
  const [roles, setRoles] = React.useState<BackendRole[]>([]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EditUser | null>(null);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("");
  const [rolesLoaded, setRolesLoaded] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        userApi.getUsers(),
        userApi.getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setRolesLoaded(true);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Set default role when roles are loaded
  React.useEffect(() => {
    if (rolesLoaded && roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(String(roles[0].id));
    }
  }, [rolesLoaded, roles, selectedRoleId]);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setEmail("");
    setPassword("");
    // Set default role
    if (roles.length > 0) {
      setSelectedRoleId(String(roles[0].id));
    }
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing({ id: u.id, name: u.name, email: u.email, role: u.role });
    setName(u.name);
    setEmail(u.email);
    setPassword(""); // Don't show password when editing
    // Find the role ID that matches the user's role
    const userRole = roles.find((r) => {
      const roleCode = r.code.toLowerCase();
      if (
        u.role === "Admin" &&
        (roleCode === "super_admin" || roleCode.includes("admin"))
      )
        return true;
      if (
        u.role === "Data Entry" &&
        (roleCode === "risk_manager" || roleCode === "risk_owner")
      )
        return true;
      if (u.role === "Viewer" && roleCode === "viewer") return true;
      return false;
    });
    setSelectedRoleId(
      userRole
        ? String(userRole.id)
        : roles.length > 0
        ? String(roles[0].id)
        : ""
    );
    setDialogOpen(true);
  };

  const save = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail) {
      toast({ title: strings.users.missingFields, variant: "destructive" });
      return;
    }

    // Role is required
    if (!selectedRoleId) {
      toast({ title: strings.users.roleRequiredTitle, variant: "destructive" });
      return;
    }

    // Password is required for new users
    if (!editing && !trimmedPassword) {
      toast({
        title: strings.users.passwordRequiredTitle,
        variant: "destructive",
      });
      return;
    }

    // Password must be at least 8 characters
    if (!editing && trimmedPassword.length < 8) {
      toast({
        title: strings.users.passwordMinLengthTitle,
        variant: "destructive",
      });
      return;
    }

    try {
      const roleId = parseInt(selectedRoleId, 10);

      if (editing) {
        await userApi.updateUser(editing.id, {
          fullName: trimmedName,
          email: trimmedEmail,
          roleId: roleId,
        });
        toast({
          title: strings.users.updatedTitle,
          description: strings.users.updatedDesc,
        });
      } else {
        await userApi.createUser({
          fullName: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
          roleId: roleId,
        });
        toast({
          title: strings.users.createdTitle,
          description: strings.users.createdDesc,
        });
      }
      setDialogOpen(false);
      resetForm();
      await load();
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: strings.users.saveFailedTitle,
        description: err.message || strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    }
  };

  const remove = async (u: User) => {
    try {
      await userApi.deleteUser(u.id);
      toast({
        title: strings.users.deletedTitle,
        description: strings.users.deletedDesc,
      });
      await load();
    } catch {
      toast({
        title: strings.users.deleteFailedTitle,
        description: strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    }
  };

  if (loading) return <PageLoader text={strings.common.loading} />;

  if (!canManageUsers) {
    return <PermissionDenied title={strings.common.notAllowed} />;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{strings.users.title}</h1>
          <p className="text-muted-foreground">{strings.users.subtitle}</p>
        </div>

        <Can permission="canCreate">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 me-2" />
            {strings.users.addUser}
          </Button>
        </Can>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">{strings.users.listTitle}</CardTitle>
          <CardDescription>{strings.users.listDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th
                    className={cn(
                      "py-3 px-4 font-medium",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    {strings.users.name}
                  </th>
                  <th
                    className={cn(
                      "py-3 px-4 font-medium",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    {strings.users.email}
                  </th>
                  <th className="py-3 px-4 font-medium text-center">
                    {strings.users.role}
                  </th>
                  <th className="py-3 px-4 font-medium text-center">
                    {strings.table.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td
                      className={cn(
                        "py-3 px-4",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {strings.table.id}: {u.id}
                      </p>
                    </td>
                    <td
                      className={cn(
                        "py-3 px-4 text-sm text-muted-foreground",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">{u.role}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(u)}
                          aria-label={strings.actions.edit}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(u)}
                          aria-label={strings.actions.delete}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {strings.users.noUsers}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? strings.users.editUser : strings.users.addUser}
            </DialogTitle>
            <DialogDescription>{strings.users.dialogDesc}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">{strings.users.name}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={strings.users.namePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{strings.users.email}</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={strings.users.emailPlaceholder}
              />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  {strings.users.passwordLabel} *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={strings.users.passwordPlaceholder}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{strings.users.role}</Label>
              <Select
                value={selectedRoleId}
                onValueChange={(v) => setSelectedRoleId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={strings.users.rolePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className={cn(isRTL ? "sm:flex-row-reverse" : "")}>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {strings.actions.cancel}
            </Button>
            <Button onClick={save}>{strings.actions.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
