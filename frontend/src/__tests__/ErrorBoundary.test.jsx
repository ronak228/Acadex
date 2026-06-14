import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders error UI when a child throws', () => {
    const ThrowingComponent = () => { throw new Error('boom'); };
    // suppress expected console.error from React error boundary
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    spy.mockRestore();
  });
});
