# Administração integrada e PWA do SalbCare

## Objetivo
Transformar a administração em uma área nativa do SalbCare, instalável no celular e consistente com Agenda, Pacientes e Financeiro, preservando as regras atuais de acesso e os dados existentes.

## O que será feito
1. **PWA para administradores**
   - Corrigir o registro do app para não atuar no preview e continuar disponível offline apenas onde já existe suporte.
   - Adicionar atalho administrativo à instalação e orientar Android e iPhone dentro do app.
   - Conferir o modo instalado em 360 px, inclusive o acesso a `/admin/operacao`.

2. **Operação conectada às contas**
   - Levar para `/admin/operacao` o formulário seguro já existente de criação e ativação de contas.
   - Exibir contas com e-mail ainda pendente usando o estado real de autenticação, sem criar nova tabela.
   - Permitir liberar ou remover acesso administrativo na mesma tela, sempre com confirmação e usando as regras existentes.

3. **Administração dentro do app**
   - Criar uma página inicial administrativa com botões internos para Operação, Contas, Permissões, Academy e Ajuda.
   - Criar uma tela de ajuda em português com instalação, contas, permissões e leitura dos indicadores.
   - Simplificar e traduzir o menu lateral, mantendo todas as rotas atuais.

4. **Clareza da Operação**
   - Adicionar um resumo com números de pacientes, consultas, receitas e despesas.
   - Explicar em texto curto o período e o significado de cada número, sem dados simulados.
   - Organizar registros, contas e acessos em seções fáceis de usar no celular.

5. **Visual unificado em 360 px**
   - Aplicar tokens navy, off-white, teal, Outfit e Figtree em Agenda, Pacientes e Financeiro.
   - Padronizar títulos, cartões, campos, botões e listas, sem alterar consultas ou fluxos.
   - Eliminar quebras ruins e rolagem horizontal em 360, 390 e 430 px.

## Segurança e limites
- Nenhuma tabela, política de acesso, regra de assinatura ou webhook será alterado.
- A leitura de e-mails pendentes e a criação de contas usarão funções administrativas protegidas já existentes.
- A concessão de administrador continuará exigindo uma conta existente e confirmação explícita.
- O modo sem barra do navegador funciona depois que o administrador instala o app no celular; o navegador controla a apresentação do convite de instalação.

## Validação
- Verificar tipos, testes relevantes e o resultado da compilação.
- Testar com sessão administrativa em 360, 390 e desktop.
- Conferir criação de conta sem concluir um envio real, listagem de pendências, mudança de permissão com modal e navegação interna.
- Validar manifesto, atalhos e ausência de registro do modo offline no preview.
