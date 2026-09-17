# SalbCare 2.0 — Redesenho de produto, mobile-first

## Onde estamos hoje

Existem hoje dois aplicativos paralelos dentro do mesmo projeto:

- **Área de trabalho antiga** (`/dashboard`, `/dashboard/agenda`, `/dashboard/pacientes`, `/dashboard/financial`, `/profile`): é a que tem os problemas visíveis que você apontou (título "Agenda" quebrando, botão "+ Novo" cortado, dois botões de salvar no perfil). Usa a paleta de componentes padrão, não a identidade SalbCare.
- **Painel novo** (`/pro/painel`): tem a identidade editorial correta (navy, creme, teal, dourado, Gloock, IBM Plex Mono), mas é uma tela única com abas, sem navegação de aplicativo e com dados mais simples.

Barra inferior atual: Painel, Agenda, Pacientes, Financeiro, Meu perfil. Sem Academy.

Academy hoje: catálogo de apostilas com compra pela Stripe, jogo em `/academy/jogo`, Quick Card offline, certificado por código. Não existe trilha com módulos, lições, progresso, sequência de dias nem XP.

Pagamentos: já existem preços ativos na Stripe para Inglês, Espanhol e o combo, além dos planos de assinatura. Nada será recriado.

## Problemas de design que vou resolver

1. Duas linguagens visuais concorrentes no mesmo produto.
2. Cabeçalhos com elementos demais na mesma linha, causando corte e quebra de texto no celular.
3. Início com cara de painel administrativo, sem hierarquia e com atalhos que repetem a barra inferior.
4. Perfil com duas ações de salvar.
5. Academy fora do uso diário.
6. Financeiro com muitos cartões e pouca hierarquia.

## Arquitetura proposta

Barra inferior com seis áreas: Início, Agenda, Pacientes, Financeiro, Academy, Perfil. Item ativo em teal com indicador superior, respeitando a área segura do iPhone. Botão "+" contextual em cada tela, sem seção de atalhos duplicada.

## Execução por fases

Vou executar em etapas, mostrando o resultado depois de cada uma, com verificação de build e de layout em 360, 390 e 430 px.

### Fase A — Base visual, navegação e correções críticas
- Centralizar as cores e sombras num único conjunto de variáveis (navy `#0F1F3A`, creme `#F4EEE2`, teal `#34BFB4`, dourado `#CFA856`, branco para cartões), aplicadas ao aplicativo inteiro. Dourado reservado só para Academy. Nunca texto branco sobre teal. Sombra neutra discreta, cantos de 12 a 16 px, sem brilho nem gradiente.
- Tipografia: aproveitar Gloock, IBM Plex Mono e Karla, que já estão instalados. Nenhuma fonte nova.
- Novo cabeçalho de tela padrão: título sozinho na primeira linha, ação principal na segunda, ações secundárias (Modelo, Importar, Bloquear) num menu de três pontos.
- Corrigir o título da Agenda, o botão cortado em Pacientes e qualquer rolagem horizontal.
- Perfil: uma única ação de salvar, com barra fixa embaixo quando houver mudanças e confirmação discreta depois de salvar.
- Barra inferior com as seis áreas e Academy incluída.
- Todos os alvos de toque com no mínimo 48 px de altura.

### Fase B — Início, Agenda, Pacientes, Financeiro
- **Início** como central do dia: saudação com o nome real e a data; "Seu dia em 30 segundos" (consultas de hoje, saldo do mês, a receber, pendências); cartão do Copilot; "Primeiros passos" com três marcos que desaparecem quando concluídos; até três próximas consultas; cartão da Academy; link público de agendamento com copiar e confirmação. Sem banners empilhados.
- **Agenda**: hoje por padrão, linha de tempo limpa, cartão com hora, paciente, tipo, situação e valor, ações de confirmar, remarcar, cancelar e abrir paciente.
- **Pacientes**: busca, filtros (Todos, Hoje, Retorno, Pendentes, Inativos), cartão com última e próxima consulta e situação financeira; detalhe com resumo, histórico em linha de tempo, consultas, financeiro, documentos, teleconsulta e observações.
- **Financeiro**: pergunta de abertura, um número principal de receita do mês, depois recebido, a receber, despesas e resultado; gráfico simples; ações rápidas de receita, despesa e cobrança. Só dados reais.
- Estados vazios diretos, com contexto, mensagem clara e ação.

### Fase C — Academy como produto
- Início da Academy com sequência de dias, progresso, "continuar" e as trilhas de Inglês e Espanhol, cada uma com módulos e lições, os dois primeiros módulos livres.
- Experiência de lição em tela única por exercício, com barra de progresso, múltipla escolha, completar frase, associar, ouvir e escolher e pronúncia usando a voz do próprio navegador.
- Ao concluir: XP, progresso, sequência e convite para voltar amanhã.
- Conteúdo bloqueado abre uma folha inferior de compra com Inglês, Espanhol e o combo destacado como melhor valor, usando os preços já existentes na Stripe. Depois da compra, o conteúdo correspondente é liberado.
- Certificado com nome, curso e data, com opção de exportar e compartilhar por meios realmente suportados.

### Fase D — SalbCare Global
Ação discreta "Frases PT / EN / ES" na teleconsulta e na ficha do paciente, abrindo uma folha inferior com Acolhimento, Anamnese, Sintomas, Orientações e Encerramento, cada frase com original, tradução, copiar e ouvir. Conteúdo fixo, funciona sem internet, abre na hora.

### Fase E — Copilot
Cartão e tela de insights orientados a ação, calculados a partir dos seus dados reais (consultas sem confirmação, previsão de recebimento do dia, pacientes sem retorno, comparação de faturamento), cada um com o botão que resolve. Nada inventado.

### Fase F — Instalação no celular
Revisar nome, ícones, cor e funcionamento sem internet do aplicativo instalável e o convite de instalação, sem atrasar o redesenho.

## Detalhes técnicos

- Sem mudança de stack e sem novas dependências: React, Vite, Tailwind, Supabase, Stripe, lucide-react, fontes já instaladas.
- Sem alterar esquema de banco, políticas de acesso, webhooks da Stripe ou autenticação. Se em algum ponto uma tabela nova for realmente necessária (por exemplo, progresso de lições da Academy), eu paro e explico antes, com as políticas de acesso definidas.
- Progresso da Academy: existe `academy_progress`; vou reaproveitar antes de propor qualquer coisa nova.
- Nenhum ícone em forma de emoji e nenhum travessão nos textos.
- Depois de cada fase: build, verificação de erros no console e revisão de layout em 360, 390 e 430 px.

## Riscos

- A área antiga `/dashboard` e o painel `/pro/painel` precisam convergir. Vou adotar `/dashboard` como o aplicativo real e manter `/pro/painel` funcionando com redirecionamento, para não quebrar quem já entra por lá.
- Trilhas de lições exigem conteúdo escrito de Inglês e Espanhol; começo com um conjunto inicial real e você pode ampliar depois.
- Fases C a F são as mais longas; A e B entregam o ganho visível mais rápido.

## Complexidade estimada

- Fase A: média
- Fase B: alta
- Fase C: alta
- Fase D: baixa
- Fase E: média
- Fase F: baixa

## Sobre o acesso de administradora

Você respondeu que sim, então vou liberar o acesso de administradora para biancasilva.15.2012@gmail.com junto com a Fase A, para você conseguir abrir as telas de administração.
