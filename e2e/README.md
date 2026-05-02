# End-to-end tests (Playwright)

Estes testes cobrem dois grupos:

1. **Freemium / visitante anônimo** em `/experimente`. Não dependem de
   login — todo limite freemium é o mesmo de uma conta free recém-criada.
2. **Refresh / SPA / sessão autenticada** em rotas profundas
   (`/dashboard`, `/dashboard/agenda`, `/dashboard/financeiro`). Alguns
   specs precisam de uma conta de teste real.

## Run

```bash
# em um terminal — sobe o dev server
bun run dev

# em outro terminal — roda toda a suíte
bunx playwright test

# ou roda um único spec
bunx playwright test e2e/spa-refresh-authenticated.spec.ts

# atualiza snapshots
bunx playwright test --update-snapshots
```

A primeira execução baixa o Chromium (~150MB).

## Conta de teste (specs autenticados)

Os specs de refresh autenticado (`spa-refresh-authenticated.spec.ts`) e
quaisquer testes futuros que importem `e2e/helpers/auth.ts` precisam de
uma conta **profissional** (não-admin) já criada no backend. Configure:

```bash
export E2E_USER_EMAIL="qa+refresh@salbcare.com"
export E2E_USER_PASSWORD="••••••••"
```

Sem essas variáveis os specs são **skippados automaticamente** via
`requireTestUser` — não falham o pipeline de quem não tem credenciais
(ex.: PRs externos).

O helper faz login direto contra `auth/v1/token` da API Supabase e injeta
o token no `localStorage` antes do app montar (chave `sb-<ref>-auth-token`).
Isso evita digitar no form de login (lento e flaky por causa de animações
e redirects por role) e permite reaproveitar a mesma sessão entre testes
do mesmo processo.

> **Importante:** a conta de teste deve estar com `payment_status` ativo
> ou em trial e `user_type='professional'`. Se for admin, o login
> redireciona para `/admin` e os specs falham.

## Coverage

| Spec                                            | What it checks                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `freemium-limits.spec.ts`                       | Limites de pacientes/agendamentos, paywall só no botão "Novo"                  |
| `freemium-exports.spec.ts`                      | Exportação CSV + PDF baixa arquivos com dados do demo                          |
| `freemium-debug-panel.spec.ts`                  | Widget de debug freemium                                                       |
| `spa-refresh.spec.ts`                           | Cold load + F5 em rotas críticas não retorna 404                               |
| `spa-refresh-anonymous.spec.ts`                 | Visitante anônimo: rotas críticas redirecionam ou caem em guest, **nunca** 404 |
| `spa-refresh-authenticated.spec.ts`             | Login + F5 mantém sessão + renderiza heading/KPI esperado de cada tela         |
| `spa-refresh-sw-update.spec.ts`                 | Simula SW legado em `/sw.js`; kill-switch desregistra e SPA continua navegando |

## CI

Defina `PLAYWRIGHT_BASE_URL` para pular o `webServer` embutido e mirar um
preview deployado (ex.: `https://salbcare.lovable.app`).
