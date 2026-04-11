import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Error Boundary caught:', error);
    console.error('Error Info:', errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          margin: '20px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <AlertCircle size={24} />
            <h2 style={{ margin: 0 }}>Something went wrong</h2>
          </div>
          <details style={{ cursor: 'pointer', marginTop: '10px' }}>
            <summary style={{ fontWeight: 'bold' }}>Click to see error details</summary>
            <div style={{ marginTop: '10px', fontSize: '12px' }}>
              <strong>Error:</strong>
              {'\n' + (this.state.error?.toString() || 'Unknown error')}
              {'\n\n'}
              <strong>Stack:</strong>
              {'\n' + (this.state.error?.stack || 'No stack trace')}
            </div>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
