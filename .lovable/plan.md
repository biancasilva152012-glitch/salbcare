## Objetivo

Três ajustes em paralelo, sem mexer em autenticação, subscription guard ou modelo de dados:

1. Posicionar os componentes financeiros no `Dashboard.tsx`, controlados pelo `useFinancialHealth`.
2. Corrigir o link **“Ou experimente sem cadastrar →”** na landing page para ir ao marketplace público (`/profissionais`) em vez de `/experimente` (que hoje cai em `/dashboard` e dispara o fluxo logado/visitante).
3. Atualizar o texto da mensagem da IA no card “IA MENTORA EM AÇÃO” em duas landing pages.

---

## 1. Integrar componentes financeiros no Dashboard

Arquivo: `src/pages/Dashboard.tsx` (todos os imports, hooks e estado já existem nas linhas 19–24, 41–43; falta apenas renderizar o JSX).

**Posicionamento na ordem visual (após `GuestSyncReminderBanner`, antes do “Insight do dia”):**

```text
[GuestSyncReminderBanner]
[FinancialDiagnosisBanner]            ← só renderiza se isEmpty
[FinancialHealthProgress]             ← só se !isEmpty (já tem ao menos 1 lançamento)
[SmartTrialNotification]              ← se trialExpiredNotConverted && hasMinimumForSmartNotification
[AIPreviewLockedCard]                 ← se hasMinimumForPreview && !aiUnlocked
[Insight do dia]
... resto do dashboard inalterado
```

**Regras de exibição (vindas do hook `useFinancialHealth`):**
- `FinancialDiagnosisBanner` recebe `hidden={!financialHealth.isEmpty}` (já cobre seu próprio dismiss em localStorage).
- `FinancialHealthProgress` recebe `steps`, `progressPercent` e `onPremiumStepClick={openUpgrade}` para abrir o modal quando o usuário clicar na etapa “Deixe a IA analisar seu perfil”.
- `AIPreviewLockedCard` aparece quando `financialHealth.hasMinimumForPreview` for `true` E o usuário ainda não estiver no Plano Essencial (ou seja, a etapa `ai_analysis` continua locked). Clique → `openUpgrade`.
- `SmartTrialNotification` aparece quando `financialHealth.trialExpiredNotConverted && financialHealth.hasMinimumForSmartNotification`. Recebe `monthlyIncome={financialHealth.monthlyIncome}` e `onUpgrade={openUpgrade}`.
- Enquanto `financialHealth.isLoading` for `true`, não renderizar nenhum dos quatro (evita flash).

**Modal de upgrade:** já existe `<UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />` que precisa ser montado uma vez no fim do JSX, dentro do `<PageContainer>`. Confirmar a prop API real do `UpgradeModal` antes de plugar (provavelmente `open`/`onOpenChange`); foco no card do Plano Essencial fica responsabilidade do próprio modal — não vamos forçar prop nova.

---

## 2. Corrigir “Ou experimente sem cadastrar →” → marketplace público

**Rota correta já existe:** `/profissionais` → `PublicProfessionals` (rota pública, sem `ProfessionalRoute`/`AuthGuard`/`SubscriptionGuard` no `App.tsx` linha 139). É a página de marketplace de profissionais aberta para visitantes — exatamente o que o usuário pediu.

**Mudanças:**

- `src/pages/ParaProfissionais.tsx` linha 162: trocar `to="/experimente"` por `to="/profissionais"` no link “Ou experimente sem cadastrar →”. Manter o tracking `experimente_demo` (ou renomear para `marketplace_visitante` se preferir — vou manter o evento atual para não perder histórico).
- O botão **“Testar agora”** (linhas 140 e 59 de `Index.tsx`, e linha 81) **NÃO muda** — continua apontando para `/experimente`.
- O link **“Já é cadastrado? Faça login”** (linha 170) **NÃO muda**.

**Não há link equivalente “experimente sem cadastrar” em `Index.tsx`** — só em `ParaProfissionais.tsx`. Confirmado por leitura completa dos dois arquivos.

**Não criar página nova:** `/profissionais` já cumpre o papel de marketplace público.

---

## 3. Atualizar texto do card “IA MENTORA EM AÇÃO”

Texto atual (idêntico nos dois arquivos):
> "Sua receita cresceu 12% este mês. Quer ver como otimizar seus impostos?"

Trocar por:
> "Você teve mais consultas esse mês! Quer que eu mostre onde investir o dinheiro extra para lucrar ainda mais?"

**Arquivos:**
- `src/pages/Index.tsx` linha 158
- `src/pages/ParaProfissionais.tsx` linha 184

Botão de resposta “Sim, me mostre” permanece intocado. Estilo, cor, layout do card e estrutura do balão ficam iguais.

---

## Detalhes técnicos

- Nenhuma alteração em rotas, guards, RLS, schema ou hooks de auth.
- Nenhum teste novo é estritamente necessário, mas vale rodar `vitest` rapidamente para confirmar que `Experimente.test.tsx` e `ParaProfissionais` (se houver snapshot) não quebram.
- Nenhuma migração de banco.
- O `UpgradeModal` será renderizado uma vez no fim do `<PageContainer>` do dashboard; estado local `upgradeOpen` já existe.

## Arquivos tocados

- `src/pages/Dashboard.tsx` — inserir 4 blocos JSX + montar `<UpgradeModal />`.
- `src/pages/ParaProfissionais.tsx` — trocar `to` do link experimente; atualizar texto do balão IA.
- `src/pages/Index.tsx` — atualizar texto do balão IA.
