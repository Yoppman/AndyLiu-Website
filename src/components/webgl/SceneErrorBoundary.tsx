import React from 'react';

interface Props {
  /** Shown in place of the 3D layer if it fails (e.g. a still poster). Defaults to nothing. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Catches errors thrown while a WebGL / react-three-fiber canvas renders.
 *
 * The important case is a failed context creation: Chrome caps the number of
 * live WebGL contexts per page (~16), and once that budget is exhausted the next
 * canvas's getContext() returns null and R3F throws. Suspense does NOT catch
 * thrown errors (only promises), so without this boundary that throw unmounts the
 * whole route and paints a blank white page. Here we instead drop the 3D layer
 * and fall back to a static poster, keeping the rest of the page alive.
 */
class SceneErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[WebGL] scene failed — dropping the 3D layer:', error);
    }
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}

export default SceneErrorBoundary;
