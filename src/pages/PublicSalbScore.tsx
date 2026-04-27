import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, FileCheck2, TrendingUp, Lock, BadgeCheck } from "lucide-react";
import { trackCtaClick } from "@/hooks/useTracking";

const C = {
  bg: "#FAFAF7",
  card: "#FFFFFF",
  text: "#0A0A0A",
  textMuted: "#5A5A5A",
  border: "rgba(10,10,10,0.08)",
  borderStrong: "rgba(10,10,10,0.16)",
  teal: "#0F766E",
  tealTint: "rgba(15,118,110,0.08)",
  borderTeal: "rgba(15,118,110,0.25)",
  tealOnDark: "#FFFFFF",
};

const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as any } },
};

const ScoreRing = ({ score = 720 }: { score?: number }) => {
  const pct = Math.min(1, Math.max(0, score / 1000));
  const C_ = 2 * Math.PI * 70;
  return (
    <div style={{ width: 200, height: 200, position: "relative" }}>
      <svg width={200} height={200} viewBox="0 0 200 200">
        <circle cx={100} cy={100} r={70} fill="none" stroke={C.border} strokeWidth={14} />
        <circle
          cx={100} cy={100} r={70} fill="none" stroke={C.teal} strokeWidth={14}
          strokeLinecap="round" strokeDasharray={C_}
          strokeDashoffset={C_ * (1 - pct)}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>SalbScore</span>
        <span style={{ fontSize: 48, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>de 1000</span>
      </div>
    </div>
  );
};

const PublicSalbScore = () => {
  return (
    <>
      <Helmet>
        <title>SalbScore — A identidade financeira do profissional de saúde | SalbCare</title>
        <meta
          name="description"
          content="O SalbScore é a primeira pontuação de saúde financeira para profissionais autônomos da saúde no Brasil. Comprove renda, conquiste crédito e seja reconhecido pelo mercado."
        />
        <link rel="canonical" href="https://salbcare.com.br/salbscore" />
        <meta property="og:title" content="SalbScore — Identidade financeira do profissional de saúde" />
        <meta property="og:description" content="Sua pontuação oficial de saúde financeira. De 0 a 1000. Construída com seus atendimentos reais na SalbCare." />
        <meta property="og:url" content="https://salbcare.com.br/salbscore" />
        <meta property="og:image" content="https://salbcare.com.br/og-image.png" />
      </Helmet>

      <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>
        {/* Nav */}
        <nav style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(250,250,247,0.85)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 50 }}>
          <div className="mx-auto max-w-6xl px-5 sm:px-6 flex items-center justify-between" style={{ height: 64 }}>
            <Link to="/" style={{ fontWeight: 800, color: C.text, letterSpacing: "-0.02em", fontSize: 17 }}>SalbCare</Link>
            <Link
              to="/register?source=salbscore-nav"
              onClick={() => trackCtaClick("register_nav", "salbscore_page")}
              style={{
                background: C.teal, color: C.tealOnDark, padding: "10px 18px",
                borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none",
              }}
            >
              Começar grátis
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-5 sm:px-6 grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={reveal.hidden} animate={reveal.show}>
              <span style={{
                display: "inline-block", background: C.tealTint, color: C.teal,
                fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "6px 12px", borderRadius: 999, border: `1px solid ${C.borderTeal}`,
              }}>
                Em desenvolvimento · roadmap 2026
              </span>
              <h1 style={{ fontSize: "clamp(34px, 5vw, 54px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginTop: 20 }}>
                Sua identidade financeira como profissional da saúde.
              </h1>
              <p style={{ color: C.textMuted, fontSize: 18, lineHeight: 1.6, marginTop: 18 }}>
                O <strong style={{ color: C.text }}>SalbScore</strong> é uma pontuação de 0 a 1000 que comprova
                seu volume de atendimentos, sua regularidade no conselho e seu histórico de receita —
                construída com os dados reais da sua prática na SalbCare.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register?source=salbscore-hero"
                  onClick={() => trackCtaClick("register_hero", "salbscore_page")}
                  style={{
                    background: C.teal, color: C.tealOnDark, padding: "14px 24px", borderRadius: 12,
                    fontWeight: 600, fontSize: 15, textDecoration: "none", display: "inline-flex",
                    alignItems: "center", gap: 8,
                  }}
                >
                  Começar a construir meu score <ArrowRight size={16} />
                </Link>
                <Link
                  to="/checkout?plan=basic&source=salbscore-hero"
                  onClick={() => trackCtaClick("checkout_essencial", "salbscore_page")}
                  style={{
                    background: "transparent", color: C.text, padding: "14px 24px", borderRadius: 12,
                    fontWeight: 600, fontSize: 15, textDecoration: "none", border: `1px solid ${C.borderStrong}`,
                  }}
                >
                  Assinar Essencial — R$ 89/mês
                </Link>
              </div>
            </motion.div>

            <motion.div initial={reveal.hidden} animate={reveal.show} className="flex justify-center">
              <ScoreRing score={720} />
            </motion.div>
          </div>
        </section>

        {/* O problema */}
        <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }} className="py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Profissional de saúde autônomo é financeiramente invisível.
            </h2>
            <p style={{ color: C.textMuted, fontSize: 17, lineHeight: 1.7, marginTop: 16 }}>
              Você recebe R$ 15 mil em Pix por mês, atende 80 pacientes ativos, está
              regular no conselho há 6 anos. E mesmo assim, quando precisa alugar
              consultório, financiar equipamento ou aprovar cartão com limite decente,
              o sistema te trata como se você não existisse.
            </p>
            <p style={{ color: C.textMuted, fontSize: 17, lineHeight: 1.7, marginTop: 14 }}>
              É porque o sistema financeiro foi desenhado para CLT e PJ tradicional.
              Recibo de Pix, transferência PF, dinheiro físico — nada disso vira score.
            </p>
            <p style={{ color: C.text, fontSize: 17, lineHeight: 1.7, marginTop: 14, fontWeight: 600 }}>
              O SalbScore existe pra mudar isso.
            </p>
          </div>
        </section>

        {/* Como é calculado */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center" }}>
              Como o seu SalbScore é calculado
            </h2>
            <p style={{ color: C.textMuted, fontSize: 16, textAlign: "center", marginTop: 12, maxWidth: 620, marginInline: "auto" }}>
              Seis dimensões objetivas, todas extraídas dos dados que você já registra na plataforma.
            </p>

            <div className="mt-12 grid sm:grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, title: "Histórico de atendimentos", body: "Volume mensal, frequência e retenção dos seus pacientes ao longo do tempo." },
                { icon: FileCheck2, title: "Recebimentos comprovados", body: "Pix, cartão e boletos confirmados pela plataforma — não autodeclarados." },
                { icon: BadgeCheck, title: "Conformidade regulatória", body: "Registro válido no conselho (CFM, CRP, CRN, CRO) e ausência de processos éticos." },
                { icon: ShieldCheck, title: "Tempo de atuação verificado", body: "Validado direto na base do seu conselho de classe — não preenchido por você." },
                { icon: TrendingUp, title: "Diversificação de receita", body: "Quantidade de pacientes únicos por mês e estabilidade ao longo do ano." },
                { icon: Lock, title: "Comportamento financeiro", body: "Separação pró-labore, regime tributário adequado e reserva mensal." },
              ].map((dim, i) => (
                <motion.div
                  key={dim.title}
                  initial={reveal.hidden}
                  whileInView={reveal.show}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22,
                  }}
                >
                  <dim.icon size={20} color={C.teal} strokeWidth={2.2} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 12, color: C.text }}>{dim.title}</h3>
                  <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6, marginTop: 6 }}>{dim.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* O que você precisa registrar */}
        <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }} className="py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <h2 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
              O que você precisa registrar pra começar
            </h2>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
              {[
                "Cadastro do seu conselho (CRM, CRP, CRN, CRO etc.) com número e UF",
                "Suas consultas — presenciais e por teleconsulta — na agenda da SalbCare",
                "Recebimentos no módulo financeiro (manual ou via integração Pix futura)",
                "Confirmação de atendimentos pelos pacientes (acontece no fluxo padrão)",
                "Atualização mensal das despesas (separação pró-labore conta para o score)",
              ].map((item) => (
                <li key={item} style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  padding: "12px 0", borderBottom: `1px solid ${C.border}`,
                  color: C.text, fontSize: 15, lineHeight: 1.6,
                }}>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: 999,
                    background: C.tealTint, border: `1px solid ${C.borderTeal}`, color: C.teal,
                    fontSize: 12, fontWeight: 800, display: "inline-flex",
                    alignItems: "center", justifyContent: "center", marginTop: 1,
                  }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p style={{ color: C.textMuted, fontSize: 13, marginTop: 16, lineHeight: 1.6 }}>
              O SalbScore é recalculado automaticamente a cada novo dado registrado.
              Quanto mais consistente sua prática, mais alto seu score.
            </p>
          </div>
        </section>

        {/* O que ele desbloqueia */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center" }}>
              O que o SalbScore vai desbloquear
            </h2>
            <p style={{ color: C.textMuted, fontSize: 14, textAlign: "center", marginTop: 8 }}>
              Funcionalidades em desenvolvimento — disponíveis ao longo de 2026 para profissionais com score ativo.
            </p>
            <div className="mt-10 space-y-4">
              {[
                {
                  title: "Comprovante de Renda Oficial SalbCare",
                  body: "PDF assinado digitalmente que substitui contracheque para aluguel, financiamento imobiliário, visto e crédito. Verificável por QR Code.",
                },
                {
                  title: "Certidão de Atividade Profissional",
                  body: "Documento que comprova quantos pacientes você atende por mês há quanto tempo, com aderência ao conselho. Útil para credenciamento e processos.",
                },
                {
                  title: "Score público com consentimento",
                  body: "Bancos e parceiros financeiros consultam seu SalbScore (com sua autorização) e liberam crédito sem burocracia tradicional.",
                },
              ].map((item) => (
                <div key={item.title} style={{
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22,
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{item.title}</h3>
                  <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6, marginTop: 6 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ background: C.bg }} className="py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center" }}>
              Perguntas frequentes
            </h2>
            <div className="mt-10 space-y-3">
              {[
                {
                  q: "O SalbScore já está funcionando hoje?",
                  a: "O cálculo público está em desenvolvimento — entra em produção no roadmap 2026. Mas seu histórico já começa a contar a partir do primeiro atendimento registrado. Quanto antes você começar, mais maduro seu score quando ele estiver disponível.",
                },
                {
                  q: "Quais ações já alimentam meu histórico?",
                  a: "Cinco ações dentro da plataforma: cadastrar seu conselho (CRM, CRP, CRN, CRO etc.) com número e UF, marcar consultas na agenda, lançar recebimentos no módulo financeiro, confirmar atendimentos realizados e atualizar despesas mensais. Tudo isso já fica registrado e será considerado no cálculo.",
                },
                {
                  q: "Preciso de cartão de crédito para começar a construir meu score?",
                  a: "Não. O cadastro é grátis e não pede cartão. O Comprovante de Renda Oficial SalbCare e o score público fazem parte do roadmap — você só assina o Essencial (R$ 89/mês) quando quiser usar gestão completa, teleconsulta e IA Mentora.",
                },
                {
                  q: "Quem terá prioridade no Comprovante de Renda Oficial?",
                  a: "Profissionais com histórico ativo na plataforma — ou seja, quem já vem registrando consultas e recebimentos consistentemente — terão prioridade no acesso quando o produto for lançado.",
                },
              ].map((item) => (
                <div key={item.q} style={{
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22,
                }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{item.q}</h3>
                  <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.65, marginTop: 8 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        <section style={{ background: C.card, borderTop: `1px solid ${C.borderTeal}` }} className="py-20">
          <div className="mx-auto max-w-2xl px-5 sm:px-6 text-center">
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Comece a construir seu SalbScore hoje.
            </h2>
            <p style={{ color: C.textMuted, fontSize: 16, marginTop: 14, lineHeight: 1.6 }}>
              Cadastro gratuito, sem cartão. Cada consulta registrada é um passo a mais
              na sua identidade financeira oficial.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link
                to="/register?source=salbscore-final"
                onClick={() => trackCtaClick("register_final", "salbscore_page")}
                style={{
                  background: C.teal, color: C.tealOnDark, padding: "16px 28px", borderRadius: 12,
                  fontWeight: 600, fontSize: 15, textDecoration: "none", display: "inline-flex",
                  alignItems: "center", gap: 8,
                }}
              >
                Criar conta grátis <ArrowRight size={16} />
              </Link>
              <Link
                to="/checkout?plan=basic&source=salbscore-final"
                onClick={() => trackCtaClick("checkout_essencial_final", "salbscore_page")}
                style={{
                  background: "transparent", color: C.text, padding: "16px 28px", borderRadius: 12,
                  fontWeight: 600, fontSize: 15, textDecoration: "none", border: `1px solid ${C.borderStrong}`,
                }}
              >
                Assinar Essencial — R$ 89/mês
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ background: C.bg, borderTop: `1px solid ${C.border}` }} className="py-10">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 text-center">
            <Link to="/" style={{ color: C.textMuted, fontSize: 13, textDecoration: "none" }}>
              ← Voltar para a página inicial
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PublicSalbScore;
