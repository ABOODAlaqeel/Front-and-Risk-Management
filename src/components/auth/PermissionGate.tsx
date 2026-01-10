/**
 * Permission components.
 *
 * Helpers to show or hide content based on permissions and roles.
 */
import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/utils/constants";

// ===========================================
// Types
// ===========================================

interface BasePermissionProps {
  children: React.ReactNode;
  /** Fallback content when permission is missing. */
  fallback?: React.ReactNode;
}

interface CanProps extends BasePermissionProps {
  /** Required permission. */
  permission: PermissionKey;
}

interface CanAnyProps extends BasePermissionProps {
  /** Any of these permissions is enough. */
  permissions: PermissionKey[];
}

interface CanAllProps extends BasePermissionProps {
  /** All of these permissions are required. */
  permissions: PermissionKey[];
}

interface RoleProps extends BasePermissionProps {
  /** Allowed roles. */
  roles: string[];
}

// ===========================================
// Components
// ===========================================

/**
 *
 * @example
 * <Can permission="canCreate">
 * </Can>
 */
export const Can: React.FC<CanProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { can } = usePermissions();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
};

/**
 *
 * @example
 * <CanAny permissions={["canCreate", "canEdit"]}>
 * </CanAny>
 */
export const CanAny: React.FC<CanAnyProps> = ({
  permissions,
  children,
  fallback = null,
}) => {
  const { canAny } = usePermissions();
  return canAny(permissions) ? <>{children}</> : <>{fallback}</>;
};

/**
 *
 * @example
 * <CanAll permissions={["canEdit", "canDelete"]}>
 * </CanAll>
 */
export const CanAll: React.FC<CanAllProps> = ({
  permissions,
  children,
  fallback = null,
}) => {
  const { canAll } = usePermissions();
  return canAll(permissions) ? <>{children}</> : <>{fallback}</>;
};

/**
 *
 * @example
 * <CannotView permission="canViewSettings">
 * </CannotView>
 */
export const CannotView: React.FC<CanProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { can } = usePermissions();
  return !can(permission) ? <>{children}</> : <>{fallback}</>;
};

/**
 *
 * @example
 * <Role roles={["Admin"]}>
 *   <AdminPanel />
 * </Role>
 */
export const Role: React.FC<RoleProps> = ({
  roles,
  children,
  fallback = null,
}) => {
  const { role } = usePermissions();
  return role && roles.includes(role) ? <>{children}</> : <>{fallback}</>;
};

/**
 *
 * @example
 * <AdminOnly>
 *   <SystemSettings />
 * </AdminOnly>
 */
export const AdminOnly: React.FC<BasePermissionProps> = ({
  children,
  fallback = null,
}) => {
  const { isAdmin } = usePermissions();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
};

/**
 *
 * @example
 * <NotViewer>
 *   <EditButton />
 * </NotViewer>
 */
export const NotViewer: React.FC<BasePermissionProps> = ({
  children,
  fallback = null,
}) => {
  const { isViewer } = usePermissions();
  return !isViewer ? <>{children}</> : <>{fallback}</>;
};

// ===========================================
// HOC (Higher Order Component)
// ===========================================

/**
 *
 * @example
 * const ProtectedButton = withPermission(Button, "canCreate");
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: PermissionKey,
  FallbackComponent?: React.ComponentType
) {
  const ComponentWithPermission: React.FC<P> = (props) => {
    const { can } = usePermissions();

    if (!can(permission)) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }

    return <WrappedComponent {...props} />;
  };

  ComponentWithPermission.displayName = `withPermission(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return ComponentWithPermission;
}

/**
 *
 * @example
 * const AdminPanel = withRole(Panel, ["Admin"]);
 */
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  roles: string[],
  FallbackComponent?: React.ComponentType
) {
  const ComponentWithRole: React.FC<P> = (props) => {
    const { role } = usePermissions();

    if (!role || !roles.includes(role)) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }

    return <WrappedComponent {...props} />;
  };

  ComponentWithRole.displayName = `withRole(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return ComponentWithRole;
}

// ===========================================
// Export All
// ===========================================

export default {
  Can,
  CanAny,
  CanAll,
  CannotView,
  Role,
  AdminOnly,
  NotViewer,
  withPermission,
  withRole,
};
