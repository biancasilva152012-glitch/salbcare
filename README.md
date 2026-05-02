# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## Service Worker & bug de refresh (F5)

A SalbCare é uma SPA. Para evitar regressões do bug "página não encontrada ao
atualizar", mantemos dois service workers convivendo:

- **`public/push-sw.js`** — SW ativo em produção, registrado por
  `src/main.tsx`. Cuida de Web Push e nada mais.
- **`public/sw.js`** — **kill-switch** que se autodestrói. Existe apenas para
  desregistrar versões antigas do SW que interceptavam navegações e quebravam
  refresh em rotas profundas (`/dashboard`, `/agenda`, `/dashboard/financeiro`).

### Como atualizar o service worker

1. Edite **somente** `public/push-sw.js` para mudanças reais de
   funcionalidade (push, cache, etc.). **Não** renomeie o arquivo — os
   navegadores dos usuários estão registrados nesse caminho.
2. **Nunca** reintroduza um SW em `/sw.js`. Esse caminho é reservado ao
   kill-switch e precisa continuar se desregistrando para limpar instalações
   legadas. Manter o arquivo por pelo menos 1 release após qualquer mudança.
3. Após o deploy, para forçar a atualização em um device de teste:
   `DevTools → Application → Service Workers → Update` (ou marque
   "Update on reload"). Em seguida, dê reload duas vezes.
4. Se precisar limpar tudo: `DevTools → Application → Storage → Clear site
   data`.

### Como validar o bug de refresh após o deploy

Manualmente, para cada rota crítica (`/dashboard`, `/dashboard/agenda`,
`/dashboard/financeiro`):

1. Faça login em https://salbcare.com.
2. Navegue até a rota e pressione **F5** (ou Cmd+R).
3. A página deve recarregar **sem 404** e **sem tela em branco**, mantendo o
   usuário logado. Se deslogado, deve cair em `/login` — nunca em
   `/index.html` cru ou "Página não encontrada".
4. Repita em uma aba anônima colando a URL diretamente: deve redirecionar
   para `/login` (não 404).

Automaticamente:

```sh
bunx playwright test e2e/spa-refresh.spec.ts
```

O spec valida que F5 nas três rotas retorna HTTP 200 e renderiza a SPA
(nunca a tela de NotFound do servidor).

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
