/**
 * usePermissions Hook - permissions helper utilities.
 *
 * Provides helper methods for checking user permissions.
 */
import { useMemo, useCallback } from "react";
import { useAuth } from "@/auth/authContext";
import type { PermissionKey } from "@/utils/constants";

export interface UsePermissionsReturn {
  /** Check a single permission. */
  can: (permission: PermissionKey) => boolean;
  /** Check at least one permission. */
  canAny: (permissions: PermissionKey[]) => boolean;
  /** Check all permissions. */
  canAll: (permissions: PermissionKey[]) => boolean;
  /** Whether the user is Admin. */
  isAdmin: boolean;
  /** Whether the user is Data Entry. */
  isDataEntry: boolean;
  /** Whether the user is Viewer. */
  isViewer: boolean;
  /** User role. */
  role: string | null;
  /** Can create. */
  canCreate: boolean;
  /** Can edit. */
  canEdit: boolean;
  /** Can delete. */
  canDelete: boolean;
  /** Can export. */
  canExport: boolean;
  /** Can view settings. */
  canViewSettings: boolean;
  /** Can view audit log. */
  canViewAudit: boolean;
  /** Can manage users. */
  canManageUsers: boolean;
}

/**
 *
 * @example
 * const { can, isAdmin, canCreate } = usePermissions();
 *
 * if (canCreate) {
 * }
 *
 * if (can("canDelete")) {
 * }
 */
export function usePermissions(): UsePermissionsReturn {
  const { user, can } = useAuth();

  const role = useMemo(() => user?.role ?? null, [user]);

  const isAdmin = useMemo(() => role === "Admin", [role]);
  const isDataEntry = useMemo(() => role === "Data Entry", [role]);
  const isViewer = useMemo(() => role === "Viewer", [role]);

  const canAny = useCallback(
    (permissions: PermissionKey[]): boolean => {
      return permissions.some((p) => can(p));
    },
    [can]
  );

  const canAll = useCallback(
    (permissions: PermissionKey[]): boolean => {
      return permissions.every((p) => can(p));
    },
    [can]
  );

  const canCreate = useMemo(() => can("canCreate"), [can]);
  const canEdit = useMemo(() => can("canEdit"), [can]);
  const canDelete = useMemo(() => can("canDelete"), [can]);
  const canExport = useMemo(() => can("canExport"), [can]);
  const canViewSettings = useMemo(() => can("canViewSettings"), [can]);
  const canViewAudit = useMemo(() => can("canViewAudit"), [can]);
  const canManageUsers = useMemo(() => can("canManageUsers"), [can]);

  return {
    can,
    canAny,
    canAll,
    isAdmin,
    isDataEntry,
    isViewer,
    role,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canViewSettings,
    canViewAudit,
    canManageUsers,
  };
}

export default usePermissions;
