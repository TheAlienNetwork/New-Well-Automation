import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-950 text-gray-200 p-8">
          <div className="container mx-auto px-4 py-6">
            <div className="bg-red-900/30 border border-red-800 rounded-md p-6 text-center">
              <h2 className="text-xl font-bold text-red-400 mb-2">
                Display Error
              </h2>
              <p className="text-gray-300 mb-4">
                There was an error displaying this component. This could be due
                to invalid data or calculation errors.
              </p>
              <p className="text-gray-400 text-sm">
                Try refreshing the page or check the data for any
                inconsistencies.
              </p>
              {this.state.error && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded text-left overflow-auto max-h-32 text-xs">
                  <p className="text-red-400 font-mono">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
