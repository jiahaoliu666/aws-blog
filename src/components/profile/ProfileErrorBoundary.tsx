import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ProfileError } from '../../hooks/profile/utils/errors';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ProfileErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error instanceof ProfileError) {
      console.error('Profile Error:', {
        code: error.code,
        message: error.message,
        field: error.field
      });
    }
    
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// 錯誤顯示組件
export const ErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="error-container">
    <h3>出現錯誤</h3>
    <p>{error?.message || '請稍後再試'}</p>
  </div>
); 