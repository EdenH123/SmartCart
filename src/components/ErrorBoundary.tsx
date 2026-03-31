'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
          <h3 className="mt-3 text-sm font-semibold text-red-800 dark:text-red-300">
            {this.props.section ? `שגיאה ב${this.props.section}` : 'משהו השתבש'}
          </h3>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {this.state.error?.message || 'אירעה שגיאה בלתי צפויה'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors dark:bg-red-800/50 dark:text-red-300 dark:hover:bg-red-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            נסו שוב
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
