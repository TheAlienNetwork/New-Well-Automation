import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Component error caught:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-md text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-red-400 mr-2" />
            <h3 className="text-red-400 font-medium">Display Error</h3>
          </div>
          <p className="text-sm text-gray-300 mb-2">
            There was an error displaying this component. This could be due to
            invalid data or calculation errors.
          </p>
          <p className="text-xs text-gray-400">
            Try refreshing the page or check the data for any inconsistencies.
          </p>
          <div className="mt-3 text-xs text-gray-500 text-left overflow-auto max-h-20">
            <pre>{this.state.error?.message}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
