import * as Sentry from "@sentry/react";

/**
 * Sentry é opcional: sem DSN configurado, todas as funções abaixo são no-op
 * e o app continua funcionando normalmente (útil no preview e em dev).
 * Para ativar, defina VITE_SENTRY_DSN no ambiente de build.
 */
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

let initialized = false;

export const isErrorReportingEnabled = () => initialized;

export function initErrorReporting() {
  if (initialized || !dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : undefined,
    // Amostragem conservadora: erros sempre, performance leve.
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    integrations: [Sentry.browserTracingIntegration()],
    beforeSend(event) {
      // Contexto automático de rota e navegador em todo evento.
      event.tags = {
        ...event.tags,
        route: window.location.pathname,
        search: window.location.search || "none",
        display_mode: window.matchMedia?.("(display-mode: standalone)").matches
          ? "standalone"
          : "browser",
      };
      event.contexts = {
        ...event.contexts,
        browser_env: {
          user_agent: navigator.userAgent,
          language: navigator.language,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          dpr: window.devicePixelRatio,
          online: navigator.onLine,
        },
      };
      return event;
    },
  });

  initialized = true;
}

/** Contexto padrão anexado a qualquer erro capturado manualmente. */
export function collectErrorContext() {
  return {
    route: window.location.pathname + window.location.search,
    userAgent: navigator.userAgent,
    language: navigator.language,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    dpr: window.devicePixelRatio,
    online: navigator.onLine,
    timestamp: new Date().toISOString(),
  };
}

export function reportError(error: unknown, extra?: Record<string, unknown>) {
  const context = { ...collectErrorContext(), ...extra };
  if (initialized) {
    Sentry.withScope((scope) => {
      scope.setTags({ route: context.route });
      scope.setContext("salbcare", context);
      Sentry.captureException(error);
    });
  } else if (import.meta.env.DEV) {
    console.error("[reportError]", error, context);
  }
}

/**
 * Captura erros que escapam do React (listeners, promises, chunks) para que
 * falhas como "dispatcher.useRef" cheguem ao monitoramento com contexto.
 */
export function attachGlobalErrorHandlers() {
  window.addEventListener("error", (event) => {
    if (!event.error && !event.message) return;
    reportError(event.error ?? new Error(event.message), { source: "window.onerror" });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason ?? new Error("Unhandled promise rejection"), {
      source: "unhandledrejection",
    });
  });
}
