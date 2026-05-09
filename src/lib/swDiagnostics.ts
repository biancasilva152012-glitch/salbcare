/**
 * Service Worker lifecycle diagnostics.
 *
 * Loga eventos críticos (registration, controllerchange, updatefound,
 * statechange) com um session ID estável para facilitar identificar
 * loops de reload no client.
 *
 * Cada log: `[sw:<level>:<sid>] <event> {meta}`.
 *
 * Verbosidade controlada por ambiente:
 *   - dev / staging / preview / hosts não-produção → tudo (info+warn+error)
 *   - produção (salbcare.com / salbcare.com.br / *.lovable.app) → só warn+error
 *   - override manual: `localStorage.setItem("salbcare_sw_debug","1")` força tudo;
 *     `"0"` força silencioso (apenas error).
 *
 * Detector de loop: 3+ controllerchange em 10s emite `sw-loop-detected` (error).
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

type Verbosity = "verbose" | "quiet" | "silent";

function detectVerbosity(): Verbosity {
  try {
    const override = localStorage.getItem("salbcare_sw_debug");
    if (override === "1") return "verbose";
    if (override === "0") return "silent";
  } catch {}

  if (import.meta.env?.DEV) return "verbose";

  const host = typeof location !== "undefined" ? location.hostname : "";
  const isProd =
    host === "salbcare.com" ||
    host === "www.salbcare.com" ||
    host === "salbcare.com.br" ||
    host === "www.salbcare.com.br" ||
    host.endsWith(".lovable.app");

  return isProd ? "quiet" : "verbose";
}

const VERBOSITY = detectVerbosity();

function shouldLog(level: Level): boolean {
  if (VERBOSITY === "silent") return level === "error";
  if (VERBOSITY === "quiet") return level !== "info";
  return true;
}

function log(level: Level, event: string, meta: Record<string, unknown> = {}) {
  if (!shouldLog(level)) return;
  const payload = { sid: SID, event, ...meta, t: Date.now() };
  const tag = `[sw:${level}:${SID}]`;
  // eslint-disable-next-line no-console
  if (level === "error") console.error(tag, event, payload);
  else if (level === "warn") console.warn(tag, event, payload);
  else console.info(tag, event, payload);
}

function controllerInfo() {
  const c = navigator.serviceWorker?.controller;
  return {
    controllerUrl: c?.scriptURL ?? null,
    controllerState: c?.state ?? null,
    controllerScope: (c as any)?.scope ?? null,
  };
}

const controllerChanges: number[] = [];
async function trackControllerChange() {
  const now = Date.now();
  controllerChanges.push(now);
  while (controllerChanges.length && now - controllerChanges[0] > 10_000) {
    controllerChanges.shift();
  }

  // Inclui scope/scriptURL do registration ativo para identificar QUAL SW
  // assumiu o controle — essencial quando há múltiplos SWs disputando "/".
  let activeRegs: { scope: string; scriptURL: string | null }[] = [];
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    activeRegs = regs.map((r) => ({
      scope: r.scope,
      scriptURL:
        r.active?.scriptURL ||
        r.waiting?.scriptURL ||
        r.installing?.scriptURL ||
        null,
    }));
  } catch {}

  log("warn", "controllerchange", {
    count_10s: controllerChanges.length,
    ...controllerInfo(),
    activeRegs,
  });

  if (controllerChanges.length >= 3) {
    log("error", "sw-loop-detected", {
      count_10s: controllerChanges.length,
      ...controllerInfo(),
      activeRegs,
      hint: "Multiple SWs swapping at same scope; check main.tsx registrations",
    });
  }
}

export function attachSwDiagnostics() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  log("info", "diagnostics-attached", {
    href: location.href,
    verbosity: VERBOSITY,
    controlled: !!navigator.serviceWorker.controller,
    ...controllerInfo(),
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    void trackControllerChange();
  });

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
