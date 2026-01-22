import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
    // In a production environment, this would log the error to Sentry/Datadog.
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center glass-card border-destructive/50">
            <CardHeader>
              <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
              <CardTitle className="text-2xl text-destructive">Application Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Something went wrong while rendering this section. Please refresh the page or try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;