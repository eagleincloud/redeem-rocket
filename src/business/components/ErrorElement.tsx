import { useRouteError }  from 'react-router-dom';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export function ErrorElement() {
  const error = useRouteError();

  // Better error message extraction
  let errorMessage = 'Unknown Error';
  let errorDetail = '';
  let status = null;

  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetail = error.stack || '';
  } else if (typeof error === 'object' && error !== null) {
    status = (error as any)?.status;
    errorMessage = (error as any)?.statusText || (error as any)?.message || JSON.stringify(error);
    errorDetail = (error as any)?.stack || '';
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  const statusCode = status || 500;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d0d18 0%, #1a0c28 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: '#1a1a2e',
        border: '1px solid #2a2a4e',
        borderRadius: '12px',
        padding: '40px',
        color: '#e2e8f0',
      }}>
        {/* Error Icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <AlertCircle
            size={48}
            color="#ef4444"
            style={{ margin: '0 auto' }}
          />
        </div>

        {/* Error Title */}
        <h1 style={{
          margin: '0 0 12px 0',
          fontSize: '28px',
          fontWeight: 800,
          color: '#fff',
          textAlign: 'center',
        }}>
          Error {statusCode}
        </h1>

        {/* Error Message */}
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '16px',
          color: '#a0aec0',
          textAlign: 'center',
        }}>
          {statusCode === 404 ? 'Page Not Found' : errorMessage}
        </p>

        {/* Error Details Box (if available) */}
        {errorDetail && (
          <div style={{
            background: '#0f0f1e',
            border: '1px solid #2a2a4e',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            maxHeight: '150px',
            overflowY: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#94a3b8',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {errorDetail.substring(0, 500)}
          </div>
        )}

        {/* Helpful Suggestions */}
        <div style={{
          background: '#1e3a5f',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <span style={{ color: '#3b82f6', marginTop: '4px' }}>💡</span>
            <div>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
              }}>
                What you can try:
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#cbd5e1',
              }}>
                <li>Refresh the page (F5 or Cmd+R)</li>
                <li>Clear browser cache and reload</li>
                <li>Check your internet connection</li>
                <li>Try again in a few moments</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#3b82f6')}
          >
            <RefreshCw size={16} />
            Refresh Page
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'transparent',
              color: '#e2e8f0',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1e3a5f';
              e.currentTarget.style.borderColor = '#60a5fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
          >
            <Home size={16} />
            Go Home
          </button>
        </div>

        {/* Development Info */}
        {import.meta.env.DEV && errorDetail && (
          <details style={{
            marginTop: '24px',
            fontSize: '12px',
            color: '#94a3b8',
            cursor: 'pointer',
          }}>
            <summary style={{ fontWeight: 600, marginBottom: '8px' }}>
              Stack Trace (Development Only)
            </summary>
            <pre style={{
              background: '#0f0f1e',
              padding: '12px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              fontSize: '11px',
              fontFamily: 'monospace',
              margin: 0,
            }}>
              {errorDetail}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
