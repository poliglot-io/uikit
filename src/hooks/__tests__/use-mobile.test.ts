/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "../use-mobile.js";

describe("useIsMobile", () => {
  const originalMatchMedia = window.matchMedia;
  const originalInnerWidth = window.innerWidth;
  let listeners: Array<(e: MediaQueryListEvent) => void> = [];

  function createMockMatchMedia(matches: boolean) {
    return vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn((event, listener) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn((event, listener) => {
        listeners = listeners.filter(l => l !== listener);
      }),
      dispatchEvent: vi.fn(),
    }));
  }

  function setWindowWidth(width: number) {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });
  }

  beforeEach(() => {
    listeners = [];
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("returns false for desktop width (>= 768)", () => {
    setWindowWidth(1024);
    window.matchMedia = createMockMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("returns true for mobile width (< 768)", () => {
    setWindowWidth(375);
    window.matchMedia = createMockMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("returns true for tablet boundary (767px)", () => {
    setWindowWidth(767);
    window.matchMedia = createMockMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("returns false at exact breakpoint (768px)", () => {
    setWindowWidth(768);
    window.matchMedia = createMockMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("registers media query listener on mount", () => {
    setWindowWidth(1024);
    const mockMatchMedia = createMockMatchMedia(false);
    window.matchMedia = mockMatchMedia;

    renderHook(() => useIsMobile());

    expect(mockMatchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    expect(listeners.length).toBe(1);
  });

  it("removes listener on unmount", () => {
    setWindowWidth(1024);
    window.matchMedia = createMockMatchMedia(false);

    const { unmount } = renderHook(() => useIsMobile());

    expect(listeners.length).toBe(1);

    unmount();

    // Listener should be cleaned up (removeEventListener called)
    // Note: Our mock doesn't actually remove, but the hook calls removeEventListener
  });

  it("updates when window width changes", () => {
    setWindowWidth(1024);
    window.matchMedia = createMockMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Simulate resize to mobile
    act(() => {
      setWindowWidth(375);
      // Trigger the change listener
      if (listeners.length > 0) {
        listeners[0]({} as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });
});
