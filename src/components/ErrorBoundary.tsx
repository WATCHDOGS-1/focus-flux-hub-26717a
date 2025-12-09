import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
    // Optionally log the error to an external service
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 bg-destructive/10 border border-destructive/50 rounded-xl text-destructive flex flex-col items-center justify-center h-full">
          <AlertTriangle className="w-8 h-8 mb-3" />
          <h2 className="text-lg font-bold">Something went wrong.</h2>
          <p className="text-sm text-muted-foreground text-center">
            The editor failed to load. Try refreshing the page or selecting a different document.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;