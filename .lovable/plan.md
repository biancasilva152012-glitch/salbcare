# Evolucao visual da landing SalbCare (70% atual, 30% editorial)

## O que funciona e fica
- Estrutura curta: cabecalho, hero, carrossel de telas reais, planos com selecao por toque, FAQ, CTA final, rodape.
- Escudo, navy e teal como assinatura. Linhas finas entre secoes (ja existem).
- Fluxos: Entrar, Testar gratis, checkout Stripe, cadastro. Nenhuma rota, dado ou integracao muda.
- Botao fixo "Testar 7 dias gratis" no celular e selos App Store / Google Play.
- Nenhum SalbScore em area publica (ja e assim; mantido).

## O que precisa de refinamento
- Fundo unico: falta alternancia off-white / areia e narrativa entre blocos.
- Respiro vertical curto para um ritmo editorial.
- Planos com cara de card SaaS (borda + radio).
- Hero sem imagem: so texto. Falta atmosfera de luz natural.
- Faltam rotulos pequenos em caixa-alta acima dos titulos de forma consistente.
- Rodape claro demais e pouco integrado.

## Plano por prioridade
1. Tokens globais (src/components/pro/brand.tsx e o bloco de estilos de Pro.tsx): areia #EFE7DA, bege #E6DCCB, terracota suave #B86F52, cafe #3B2A20, mantendo navy, teal, creme e dourado discreto. Escala de espacamento maior (secoes de 96px no celular e 160px no desktop), entrelinha 1.7 no texto.
2. Tipografia: rotulo (mono, caixa-alta, espacado), titulo maior e com mais respiro, subtitulo e texto leve. Fonte dos titulos depende da sua resposta (ver pergunta).
3. Hero: area de foto em tela cheia com luz quente, titulo curto "A tecnologia organiza. A experiencia transforma.", um unico botao de contorno fino. Sem foto enviada, fica um placeholder identificado "Foto editorial do hero: enviar".
4. Cabecalho: transparente sobre o hero, solido ao rolar; Entrar e Testar gratis com contorno fino. Mesmo estilo em SiteChrome.tsx para as outras paginas publicas.
5. Secoes: fundos alternados off-white / areia; bloco de imagem e texto assimetrico alternado entre o carrossel e os planos (com placeholder de foto).
6. Planos: trocar caixas por lista com linhas finas; selecao indicada por linha teal lateral e texto, mantendo toque de 48px e foco visivel.
7. FAQ e CTA final: mais respiro, linhas finas, botao sobrio.
8. Rodape: fundo cafe ou navy, escudo, links espacados.
9. Conferir em 360, 390, 768 e 1280px sem scroll horizontal.

## Arquivos tocados
- src/pages/Pro.tsx (estilos e composicao)
- src/components/pro/brand.tsx (tokens)
- src/components/pro/SiteChrome.tsx (cabecalho e rodape das paginas publicas)
- src/components/pro/ProScreensCarousel.tsx (so espacamento e fundo)

## Fora do escopo
Telas internas do app, banco, Stripe, login, rotas, logo.
