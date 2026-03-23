import React from 'react';

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            System Interruption Detected
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, maxWidth: 400, fontWeight: 500 }}>
            An unexpected error occurred. Your session data is protected. Please refresh the interface to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#000',
              color: '#fff',
              border: 'none',
              padding: '12px 32px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transition: 'all 0.2s',
            }}
          >
            Re-Initialize Session
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: 24, textAlign: 'left', maxWidth: 600, width: '100%' }}>
              <summary style={{ fontSize: 10, color: '#94A3B8', cursor: 'pointer', fontWeight: 800, textTransform: 'uppercase' }}>Intel Details (Dev Mode)</summary>
              <pre style={{ 
                fontSize: 11, 
                color: '#dc2626', 
                marginTop: 8, 
                overflow: 'auto', 
                background: '#FFF5F5', 
                padding: 16, 
                borderRadius: 12, 
                border: '1px solid #FED7D7' 
              }}>
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
