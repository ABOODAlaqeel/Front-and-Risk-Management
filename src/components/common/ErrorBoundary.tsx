import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { en } from '@/i18n/translations/en';
import { ar } from '@/i18n/translations/ar';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

const STORAGE_KEY = 'riskms_lang_v1';

const getLanguage = (): 'en' | 'ar' => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ar') return stored;

  const docLang = document.documentElement.lang;
  if (docLang === 'en' || docLang === 'ar') return docLang;

  const browserLang = (navigator.language || '').toLowerCase();
  return browserLang.startsWith('ar') ? 'ar' : 'en';
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      // Keep a useful log in dev tools.
      console.error('App render error:', error);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;
    const strings = getLanguage() === 'ar' ? ar : en;

    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl glass-card">
          <CardHeader>
            <CardTitle>{strings.errorBoundary.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {strings.errorBoundary.description}
            </p>
            {isDev && this.state.error && (
              <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-auto whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()}>
                {strings.errorBoundary.reload}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  this.setState({ hasError: false, error: undefined })
                }
              >
                {strings.errorBoundary.tryAgain}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default ErrorBoundary;
