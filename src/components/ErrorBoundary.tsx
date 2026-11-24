import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Unexpected error occurred.' };
  }

  componentDidCatch(error: Error) {
    console.error('Maison 704 ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#0B1117] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#DCE4EC] rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="font-serif text-3xl font-semibold">Maison 704</div>
            <p className="text-sm text-[#475569] leading-relaxed">
              Something interrupted your boutique session. Tap below to refresh cleanly.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full bg-[#0B1117] text-white text-sm font-semibold hover:bg-[#0085CA] transition-colors"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
