import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";
import type { UserRole } from "@/utils/constants";
import type { PermissionKey } from "@/utils/constants";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n";
import { PermissionDenied } from "@/components/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requirePermission?: PermissionKey;
  /** Show a denied page instead of redirecting to the dashboard. */
  showDeniedPage?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requirePermission,
  showDeniedPage = true,
}) => {
  const { isAuthenticated, isLoading, user, can } = useAuth();
  const location = useLocation();
  const { strings, isRTL } = useI18n();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className={`animate-spin ${isRTL ? "ml-2" : "mr-2"}`} />
        {strings.common.loading}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (showDeniedPage) {
      return (
        <PermissionDenied
          title={strings.common.notAllowed}
          description={strings.common.accessDeniedRole}
        />
      );
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (requirePermission && !can(requirePermission)) {
    if (showDeniedPage) {
      return (
        <PermissionDenied
          title={strings.common.notAllowed}
          description={strings.common.accessDeniedPermission}
        />
      );
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
