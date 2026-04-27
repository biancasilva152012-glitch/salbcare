# Apple Pay no Stripe Checkout — SalbCare

## Resumo

A integração usa **Stripe Checkout (hosted)**, ou seja, o pagamento acontece em
`checkout.stripe.com`, não no nosso domínio. Por isso:

- ✅ **Apple Pay e Google Pay aparecem automaticamente** no Checkout em devices
  compatíveis (iPhone/Mac com Safari + cartão na carteira; Android com Chrome).
- ✅ **Não é necessário** servir o arquivo
  `/.well-known/apple-developer-merchantid-domain-association` no nosso
  domínio — esse arquivo só é exigido quando você usa o **Stripe Payment
  Element** ou **Payment Request Button** embutidos no seu próprio site.
- ✅ Habilitamos `payment_method_types: ["card", "boleto"]` no
  `create-checkout`. O `card` é o que destrava Apple Pay e Google Pay.

## Checklist para produção

Para Apple Pay aparecer assim que você publicar:

1. **Modo Live no Stripe**
   - A `STRIPE_SECRET_KEY` em produção precisa ser uma chave `sk_live_...`.
   - A `STRIPE_WEBHOOK_SECRET` precisa ser do endpoint Live.

2. **Apple Pay habilitado no Dashboard do Stripe**
   - Stripe Dashboard → Settings → Payment methods.
   - Habilite **Apple Pay** e **Google Pay** (já vêm ativos por padrão em
     contas BR para Stripe Checkout, mas confira).

3. **Domínio registrado (apenas se um dia migrarmos para Payment Element)**
   - Hoje **não é necessário** porque usamos Checkout hosted.
   - Se migrarmos para Payment Element/Payment Request Button, o Stripe
     registra o domínio automaticamente quando chamamos
     `paymentRequest.canMakePayment()` no domínio em modo Live, **desde que**
     o arquivo `apple-developer-merchantid-domain-association` esteja servido
     em `https://salbcare.com.br/.well-known/...`. O conteúdo desse arquivo é
     gerado e baixado em
     **Dashboard → Settings → Payment methods → Apple Pay → Add new domain**.

4. **Verificação rápida pós-publish**
   - Em um iPhone com Safari, abra `https://salbcare.com.br/upgrade`, clique
     em **Virar Plus agora** e siga até o Checkout. O botão **Pay** deve
     aparecer com o ícone do Apple Pay e o cartão da Wallet.

## Por que o Pix está separado

Stripe BR ainda não suporta Pix nativamente em todas as contas. Mantemos o
Pix manual com a chave `(88) 99692-4700` exibida na tela de Checkout interna
para usuários que escolherem essa forma — o webhook
`payment_intent.succeeded` ativa a conta automaticamente quando o Pix entrar
via Stripe (quando habilitado), e a conferência manual continua disponível.
