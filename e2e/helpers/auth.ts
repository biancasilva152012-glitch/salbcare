import type { BrowserContext, Page } from "@playwright/test";

/**
 * Helpers de autenticação para os testes e2e.
 *
 * Estratégia: em vez de digitar credenciais no formulário de /login (lento e
 * flaky por causa de animações + reCAPTCHA + redirecionamentos por role),
 * fazemos signInWithPassword direto contra a API REST do Supabase Auth e
 * gravamos o token retornado no localStorage usando a MESMA chave que o
 * cliente Supabase do projeto (`sb-<ref>-auth-token`). No próximo navigate,
 * o `AuthProvider` lê esse token e a sessão já existe — sem corrida.
 *
 * Configuração:
 *   E2E_USER_EMAIL    — e-mail de uma conta profissional de teste (NÃO admin)
 *   E2E_USER_PASSWORD — senha dessa conta
 *
 * Se as variáveis não estiverem setadas, `loginAs` lança um erro claro e o
 * spec é skippado pelo wrapper `requireTestUser`.
 */

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "https://fevrdqmqmbahmeaymplq.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "";

// O cliente JS do Supabase grava em `sb-<projectRef>-auth-token`.
const PROJECT_REF = (() => {
  try {
    return new URL(SUPABASE_URL).hostname.split(".")[0];
  } catch {
    return "fevrdqmqmbahmeaymplq";
  }
})();
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

export interface TestSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: unknown;
}

let cachedSession: TestSession | null = null;

export function hasTestUser(): boolean {
  return Boolean(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD);
}

/**
 * Use no início do spec para skipá-lo automaticamente quando as credenciais
 * não estiverem configuradas (ex.: em forks / PR de contributors externos).
 */
export function requireTestUser(test: { skip: (cond: boolean, msg?: string) => void }) {
  test.skip(!hasTestUser(), "E2E_USER_EMAIL/E2E_USER_PASSWORD não configurados");
}

/**
 * Faz login uma única vez por execução de processo e cacheia a sessão.
 */
export async function fetchTestSession(): Promise<TestSession> {
  if (cachedSession && cachedSession.expires_at * 1000 > Date.now() + 60_000) {
    return cachedSession;
  }
  if (!hasTestUser()) {
    throw new Error(
      "[e2e/auth] E2E_USER_EMAIL e E2E_USER_PASSWORD precisam estar definidos.",
    );
  }
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: process.env.E2E_USER_EMAIL,
        password: process.env.E2E_USER_PASSWORD,
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[e2e/auth] login falhou (${res.status}): ${body.slice(0, 200)}`);
  }
  cachedSession = (await res.json()) as TestSession;
  return cachedSession;
}

/**
 * Injeta a sessão no localStorage da origem do preview ANTES do app montar.
 * Use após `page.goto` em uma rota leve (ex.: "/") ou via init script.
 */
export async function seedSession(context: BrowserContext, baseURL: string): Promise<TestSession> {
  const session = await fetchTestSession();
  const value = JSON.stringify(session);
  await context.addInitScript(
    ({ key, value }) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {}
    },
    { key: STORAGE_KEY, value },
  );
  // Também grava em qualquer página já aberta nessa origem.
  for (const page of context.pages()) {
    if (page.url().startsWith(baseURL)) {
      await page.evaluate(
        ({ key, value }) => window.localStorage.setItem(key, value),
        { key: STORAGE_KEY, value },
      );
    }
  }
  return session;
}

/**
 * Atalho conveniente: seed da sessão + navigate até `path`. Reaproveita a
 * mesma sessão entre testes que rodam em sequência no mesmo processo.
 */
export async function loginAs(page: Page, path = "/dashboard"): Promise<TestSession> {
  const baseURL = new URL(path, page.url() || "http://localhost:8080").origin;
  const session = await seedSession(page.context(), baseURL);
  await page.goto(path);
  return session;
}

export { STORAGE_KEY };
