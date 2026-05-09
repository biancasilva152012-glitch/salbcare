/**
 * Service Worker lifecycle diagnostics.
 *
 * Loga eventos críticos (registration, controllerchange, updatefound,
 * statechange) com um session ID estável para facilitar identificar
 * loops de reload no client. Cada log inclui:
 *   - level: info | warn | error
 *   - sid: session id (curta, estável durante a aba)
 *   - event: nome do evento
 *   - meta: dados auxiliares (url do SW, scope, state)
 *
 * Também detecta loops: se acontecerem 3+ controllerchange em < 10s,
 * emite um warn de alta visibilidade ("[sw-loop-detected]").
 */

const SID = (() => {
  try {
    const key = "salbcare_sw_sid";
    let v = sessionStorage.getItem(key);
    if (!v) {
      v = Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem(key, v);
    }
    return v;
  } catch {
    return Math.random().toString(36).slice(2, 8);
  }
})();

type Level = "info" | "warn" | "error";

function log(level: Level, event: string, meta: Record<string, unknown> = {}) {
  const payload = { sid: SID, event, ...meta, t: Date.now() };
  const tag = `[sw:${level}:${SID}]`;
  // eslint-disable-next-line no-console
  if (level === "error") console.error(tag, event, payload);
  else if (level === "warn") console.warn(tag, event, payload);
  else console.info(tag, event, payload);
}

const controllerChanges: number[] = [];
function trackControllerChange() {
  const now = Date.now();
  controllerChanges.push(now);
  while (controllerChanges.length && now - controllerChanges[0] > 10_000) {
    controllerChanges.shift();
  }
  log("info", "controllerchange", { count_10s: controllerChanges.length });
  if (controllerChanges.length >= 3) {
    log("error", "sw-loop-detected", {
      count_10s: controllerChanges.length,
      hint: "Multiple SWs swapping at same scope; check main.tsx registrations",
    });
  }
}

export function attachSwDiagnostics() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  log("info", "diagnostics-attached", {
    href: location.href,
    controlled: !!navigator.serviceWorker.controller,
    controllerUrl: navigator.serviceWorker.controller?.scriptURL ?? null,
  });

  navigator.serviceWorker.addEventListener("controllerchange", trackControllerChange);

  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      log("info", "registrations-snapshot", {
        count: regs.length,
        urls: regs.map(
          (r) =>
            r.active?.scriptURL ||
            r.waiting?.scriptURL ||
            r.installing?.scriptURL ||
            "",
        ),
        scopes: regs.map((r) => r.scope),
      });
      regs.forEach((reg) => {
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          log("info", "updatefound", {
            scope: reg.scope,
            installingUrl: sw?.scriptURL ?? null,
          });
          sw?.addEventListener("statechange", () => {
            log("info", "statechange", {
              scope: reg.scope,
              url: sw.scriptURL,
              state: sw.state,
            });
          });
        });
      });
    })
    .catch((err) => log("warn", "getRegistrations-failed", { err: String(err) }));
}
