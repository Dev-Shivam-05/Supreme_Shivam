"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches any runtime failure from the WebGL/R3F hero (context-lost, driver bug,
 * shader compile error) and renders a fallback instead of crashing the page.
 */
export class WebGLBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[hero] WebGL failed, using CSS fallback:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
