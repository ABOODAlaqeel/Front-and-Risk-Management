import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User } from "@/types";
import type { UserRole } from "@/utils/constants";
import { getEffectivePermissions, PERMISSIONS } from "@/utils/constants";
import { authApi } from "@/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<void>;
  loginWithRole: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: keyof (typeof PERMISSIONS)["Admin"]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");

      if (storedToken && storedUser) {
        try {
          const validatedUser = await authApi.validateToken();
          if (validatedUser) {
            setToken(storedToken);
            // Use validated user as source-of-truth.
            setUser(validatedUser);
            localStorage.setItem("auth_user", JSON.stringify(validatedUser));
          } else {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
          }
        } catch {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("auth_user", JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithRole = useCallback(async (role: UserRole) => {
    setIsLoading(true);
    try {
      const response = await authApi.loginWithRole(role);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("auth_user", JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole) => {
      setIsLoading(true);
      try {
        const response = await authApi.register({
          fullName: name,
          email,
          password,
        });
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("auth_user", JSON.stringify(response.user));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  }, []);

  const can = useCallback(
    (permission: keyof (typeof PERMISSIONS)["Admin"]) => {
      if (!user) return false;

      // Map frontend permission names to backend keys.
      const permissionMap: Record<string, string[]> = {
        canCreate: [
          "risks.create",
          "treatments.create",
          "assessments.create",
          "bcp.create",
        ],
        canEdit: [
          "risks.update",
          "treatments.update",
          "assessments.update",
          "bcp.update",
        ],
        canDelete: ["risks.delete", "treatments.delete", "bcp.delete"],
        canViewTreatments: ["treatments.view"],
        canViewReports: ["reports.view"],
        canViewAnalysis: ["risks.view"],
        canViewBCP: ["bcp.view"],
        canViewFollowUp: ["treatments.view"],
        canExport: ["reports.export"],
        canViewSettings: ["settings.view"],
        canViewAudit: ["audit.view"],
        canManageUsers: ["users.view", "users.create", "users.update"],
      };

      // Use backend permissions when available.
      const backendPerms = permissionMap[permission] || [];

      // If backend provided explicit permissions, check them first but
      // also fall back to role-based permissions to handle cases where
      // certain backend modules (e.g., BCP) weren't seeded with perms.
      if (user.permissions && user.permissions.length > 0) {
        const hasBackendPerm = backendPerms.some((bp) =>
          user.permissions?.includes(bp)
        );
        if (hasBackendPerm) return true;
        // Fall through to role-based fallback
      }

      // Fallback to static role permissions.
      const perms = getEffectivePermissions();
      return perms[user.role]?.[permission] ?? false;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        loginWithRole,
        logout,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
