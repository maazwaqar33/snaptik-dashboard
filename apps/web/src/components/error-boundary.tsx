import React from 'react';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message + '\n' + error?.stack };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#FF3B30', marginBottom: 16 }}>⚠ Application Error</h2>
          <pre style={{ color: '#aaa', whiteSpace: 'pre-wrap', fontSize: 12 }}>{this.state.error}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
