import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import { authApi } from "@/api/authApi";
import { useI18n } from "@/i18n";

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const { strings } = useI18n();

  const token = useMemo(() => params.get("token") || "", [params]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({
        title: strings.common.error,
        description: strings.auth.missingResetToken,
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: strings.common.error,
        description: strings.auth.passwordTooShort,
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: strings.common.error,
        description: strings.auth.passwordsDoNotMatch,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      toast({
        title: strings.auth.passwordResetSuccessTitle,
        description: strings.auth.passwordResetSuccessDesc,
      });
      navigate("/login", { replace: true });
    } catch {
      toast({
        title: strings.common.error,
        description: strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 animate-in">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {strings.auth.resetPasswordTitle}
            </CardTitle>
            <CardDescription>
              {strings.auth.resetPasswordDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{strings.auth.newPassword}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={strings.auth.newPasswordPlaceholder}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">
                  {strings.auth.confirmNewPassword}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={strings.auth.confirmNewPasswordPlaceholder}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? strings.common.loading
                  : strings.auth.resetPasswordButton}
              </Button>
            </form>

            <div className="text-sm text-muted-foreground">
              <Link to="/login" className="underline">
                {strings.auth.backToLogin}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

