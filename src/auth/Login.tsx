import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "./authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Loader2, Lock, Mail } from "lucide-react";
import type { UserRole } from "@/utils/constants";
import { getAuthStats } from "@/api/authApi";
import { userApi } from "@/api";
import type { BackendRole } from "@/types/backend";
import { useI18n } from "@/i18n";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();
  const { strings } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpRoleId, setSignUpRoleId] = useState<string>("");
  const [hasAdmin, setHasAdmin] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<BackendRole[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stats = await getAuthStats();
        if (cancelled) return;
        setHasAdmin(stats.hasAdmin);
        try {
          const rolesData = await userApi.getRoles();
          if (cancelled) return;
          const nonAdminRoles = rolesData.filter(
            (r) => !r.code.includes("admin") && r.code !== "super_admin"
          );
          setAvailableRoles(nonAdminRoles);
          if (nonAdminRoles.length > 0 && !signUpRoleId) {
            setSignUpRoleId(String(nonAdminRoles[0].id));
          }
        } catch {
          console.log("Failed to fetch roles, using defaults");
        }
      } catch {
        if (!cancelled) setHasAdmin(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/dashboard";

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast({
        title: strings.auth.toastWelcomeBackTitle,
        description: strings.auth.toastWelcomeBackDesc,
      });
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: strings.auth.toastLoginFailedTitle,
        description: strings.auth.toastLoginFailedDesc,
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedRoleObj = availableRoles.find(
        (r) => String(r.id) === signUpRoleId
      );
      const roleName =
        selectedRoleObj?.code === "viewer"
          ? "Viewer"
          : selectedRoleObj?.code === "risk_manager"
          ? "Data Entry"
          : "Viewer";

      await register(
        signUpName,
        signUpEmail,
        signUpPassword,
        roleName as UserRole
      );
      toast({
        title: strings.auth.toastAccountCreatedTitle,
        description: strings.auth.toastAccountCreatedDesc,
      });
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: strings.auth.toastSignupFailedTitle,
        description: strings.auth.toastSignupFailedDesc,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-in">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {strings.page.appName}
          </h1>
          <p className="text-muted-foreground mt-2">
            {strings.auth.productTagline}
          </p>
        </div>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{strings.auth.cardTitle}</CardTitle>
            <CardDescription>{strings.auth.cardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email">{strings.auth.tabEmail}</TabsTrigger>
                <TabsTrigger value="signup">
                  {strings.auth.tabSignup}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{strings.auth.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{strings.auth.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <Link to="/forgot-password" className="underline">
                      {strings.auth.forgotPasswordLink}
                    </Link>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {strings.actions.signingIn}
                      </>
                    ) : (
                      strings.actions.signIn
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{strings.auth.fullName}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder={strings.auth.yourName}
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{strings.auth.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@company.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">
                      {strings.auth.password}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder={strings.auth.passwordPlaceholder}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{strings.auth.role}</Label>
                    <Select
                      value={signUpRoleId}
                      onValueChange={(v) => setSignUpRoleId(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={strings.auth.selectRole} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.length > 0 ? (
                          availableRoles.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.name}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="viewer">
                              {strings.auth.roleViewerLabel}
                            </SelectItem>
                            <SelectItem value="data_entry">
                              {strings.auth.roleDataEntryLabel}
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {strings.auth.adminDisabled}
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {strings.actions.creating}
                      </>
                    ) : (
                      strings.actions.createAccount
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {strings.auth.footerVersion}
        </p>
      </div>
    </div>
  );
};

export default Login;
