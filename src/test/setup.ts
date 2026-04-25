import "@testing-library/jest-dom";

// Vite injects __APP_VERSION__ at build time. Provide a stub for vitest
// so modules that read it (e.g. subscriptionNavigation) don't blow up.
(globalThis as any).__APP_VERSION__ = (globalThis as any).__APP_VERSION__ ?? "test";


Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
