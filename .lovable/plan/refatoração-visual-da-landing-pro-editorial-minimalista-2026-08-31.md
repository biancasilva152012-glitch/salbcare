# Refatoração visual da landing /pro (editorial minimalista)

Identidade mantida: navy #0F1F3A, cream #F4EEE2, teal #34BFB4, gold #CFA856, Gloock + IBM Plex Mono, tagline "Care, without borders.". Sem travessões.

## Sistema visual (src/components/pro/brand.tsx)
- Escala tipográfica reduzida a 4 níveis: H1 (Gloock), H2 (Gloock), corpo (Inter), label mono.
- Remoção de gradientes, box-shadows e hover com translate/scale nos cards. Cards passam a ser blocos com linha fina de 1px (sem fundo translúcido, sem elevação).
- Um único estilo de botão primário (gold sólido, cantos suaves) e um secundário discreto apenas em texto com sublinhado.
- Espaçamento vertical padronizado por seção: aproximadamente 96px no desktop e 72px no mobile, com separadores em linha fina de 1px em vez de caixas.

## Seções

1. Navbar
   - Desktop: logotipo mono à esquerda, 3 links, 1 CTA.
   - Mobile: menu hambúrguer funcional (botão com aria-expanded, painel colapsável, fecha ao navegar).

2. Hero
   - Uma ideia: "Seu consultório organizado, do agendamento ao financeiro."
   - Label mono, H1, um subtítulo curto, um único CTA ("Testar 14 dias grátis") e a microcópia "Sem cartão de crédito".
   - Prova social reduzida de 3 bullets com check para uma linha única em mono, sem ícones.
   - Tagline "Care, without borders." como assinatura discreta.

3. Problema
   - Deixa de ser 3 cards. Vira uma lista tipográfica simples separada por linhas finas, com o H2 atual. Sem CTA nesta seção.

4. Funcionalidades
   - Grade de 4 itens sem cards e sem ícones decorativos: título mono, uma linha de texto, separadores finos.
   - Acompanha 1 screenshot real do produto (painel) ao lado, em bloco único.

5. Screenshots do produto (novo)
   - Capturas reais das telas Agenda, Pacientes e Financeiro do painel, feitas em sessão autenticada de teste e salvas em src/assets/pro/. Exibidas em bloco com borda fina, legenda mono, lazy loading e dimensões fixas para não causar layout shift.
   - Caso alguma tela não possa ser capturada com dados de demonstração aceitáveis, uso apenas as que ficarem legíveis e informo quais.

6. Módulo internacional
   - Sai o card gold destacado. Fica uma faixa de cor sólida discreta com H2, um parágrafo e a nota "Opcional, ligado nas configurações". Sem CTA concorrente.

7. Depoimentos
   - Simplificados para citação em Gloock com atribuição em mono, sem card nem aspas decorativas grandes. Mantidos apenas os depoimentos reais existentes.

8. Planos (correções obrigatórias)
   - Remoção do selo "Mais escolhido" (sem dado que sustente, risco CDC art. 37).
   - Seleção de plano visível antes do checkout, com estado selecionado marcado por linha e label mono, sem cor de destaque extra.
   - Preços corretos e desconto anual calculado e exibido de forma explícita: mensal R$ 99 por mês; anual R$ 897 por ano, equivalente a R$ 74,75 por mês, economia de R$ 291 em relação a 12 meses do plano mensal (aproximadamente 24 por cento).
   - Um único CTA "Assinar agora" abaixo da seleção, com resumo do plano escolhido logo acima do botão, sem redirecionar sem contexto.

9. FAQ
   - Mantido o acordeão, com bordas finas, tipografia unificada e sem CTA dentro da seção.

10. CTA final
   - Sai a caixa. Fica bloco centralizado com H2, uma linha e um único CTA.

11. Footer
   - Links legais obrigatórios: Termos de uso, Política de privacidade, LGPD, Contato e Sobre, mais CNPJ/razão social se disponível, e o aviso de que os valores dos atendimentos são definidos por cada profissional.

## Acentuação e QA
- Varredura de acentos e cedilhas em todo o texto da landing, gravando o arquivo em UTF-8 e conferindo com verificação automática de mojibake.
- Checagem visual em 390px, 768px e 1280px via Playwright, incluindo abertura do menu mobile e seleção de plano.
- Nenhuma alteração em preços do Stripe, IDs de price, rotas de checkout ou lógica de assinatura.
