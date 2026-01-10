import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import { Mail } from "lucide-react";
import { authApi } from "@/api/authApi";
import { useI18n } from "@/i18n";

export const ForgotPassword: React.FC = () => {
  const { toast } = useToast();
  const { strings } = useI18n();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDevToken(null);
    try {
      const result = await authApi.forgotPassword(email);
      const token = (result as { token?: string } | undefined)?.token;
      if (token) setDevToken(token);
      toast({
        title: strings.auth.resetLinkSentTitle,
        description: strings.auth.resetLinkSentDesc,
      });
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
              {strings.auth.forgotPasswordTitle}
            </CardTitle>
            <CardDescription>
              {strings.auth.forgotPasswordDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{strings.auth.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={strings.auth.emailPlaceholder}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? strings.common.loading
                  : strings.auth.sendResetLink}
              </Button>
            </form>

            {devToken ? (
              <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm">
                <p className="font-medium mb-2">
                  {strings.auth.devTokenTitle}
                </p>
                <p className="break-all font-mono text-xs">{devToken}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(devToken)}`}
                    className="underline"
                  >
                    {strings.auth.openResetPage}
                  </Link>
                </p>
              </div>
            ) : null}

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

