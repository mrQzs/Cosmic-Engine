'use client';

import React, { type ReactNode } from 'react';
import SignalLost from './SignalLost';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class CanvasErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[CanvasErrorBoundary] WebGL/3D render error:', error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SignalLost
          error={this.state.error ?? undefined}
          resetFn={this.handleReset}
          title="RENDERING FAILURE"
        />
      );
    }
    return this.props.children;
  }
}

/**
 * Functional wrapper for CanvasErrorBoundary.
 * Also handles WebGL context loss events.
 */
export default function CanvasErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  const [contextLost, setContextLost] = React.useState(false);

  React.useEffect(() => {
    let canvasEl: HTMLCanvasElement | null = null;
    let observer: MutationObserver | null = null;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('[CanvasErrorBoundary] WebGL context lost');
      setContextLost(true);
    };

    const handleContextRestored = () => {
      console.info('[CanvasErrorBoundary] WebGL context restored');
      setContextLost(false);
    };

    const attachListeners = (canvas: HTMLCanvasElement) => {
      canvasEl = canvas;
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);
    };

    // Try to attach immediately if canvas already exists
    const existing = document.querySelector('canvas');
    if (existing) {
      attachListeners(existing);
    } else {
      // Wait for canvas to appear in the DOM (child mounts after boundary)
      observer = new MutationObserver(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          attachListeners(canvas);
          observer?.disconnect();
          observer = null;
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Unified cleanup: always remove both observer and canvas listeners
    return () => {
      observer?.disconnect();
      if (canvasEl) {
        canvasEl.removeEventListener('webglcontextlost', handleContextLost);
        canvasEl.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, []);

  if (contextLost) {
    return <SignalLost title="GPU CONTEXT LOST" resetFn={() => window.location.reload()} />;
  }

  return <CanvasErrorBoundary>{children}</CanvasErrorBoundary>;
}
