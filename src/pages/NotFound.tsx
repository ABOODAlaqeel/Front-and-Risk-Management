import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { useI18n } from "@/i18n";

const NotFound = () => {
  const navigate = useNavigate();
  const { strings, isRTL } = useI18n();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground mb-6">{strings.notFound.message}</p>
        <Button onClick={() => navigate('/dashboard')}>
          {isRTL ? (
            <>
              {strings.notFound.backToDashboard}
              <ArrowLeft className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {strings.notFound.backToDashboard}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
