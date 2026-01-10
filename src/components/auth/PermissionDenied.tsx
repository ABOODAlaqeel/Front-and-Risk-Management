/**
 * PermissionDenied - Access denied page.
 *
 * Rendered when the user lacks the required permissions.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX, Home, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

interface PermissionDeniedProps {
  /** Title text. */
  title?: string;
  /** Description text. */
  description?: string;
  /** Show the back button. */
  showBackButton?: boolean;
  /** Show the home button. */
  showHomeButton?: boolean;
  /** Additional className. */
  className?: string;
}

const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  title,
  description,
  showBackButton = true,
  showHomeButton = true,
  className,
}) => {
  const navigate = useNavigate();
  const { strings } = useI18n();
  const resolvedTitle = title || strings.common.permissionDeniedTitle;
  const resolvedDescription = description || strings.common.permissionDeniedDesc;

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[60vh] p-4",
        className
      )}
    >
      <Card className="w-full max-w-md text-center glass-card">
        <CardHeader className="pb-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-xl text-destructive">
            {resolvedTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{resolvedDescription}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {showBackButton && (
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {strings.actions.back}
              </Button>
            )}
            {showHomeButton && (
              <Button onClick={() => navigate("/dashboard")}>
                <Home className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {strings.common.home}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionDenied;
