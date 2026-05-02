// Seção 5 — Todas as ferramentas. Lista vertical (35/65), CTA final.
import { Link } from "react-router-dom";
import {
  Calendar,
  FileText,
  PenTool,
  Video,
  LineChart,
  Receipt,
  MessageCircle,
  LayoutDashboard,
} from "lucide-react";
import { trackCtaClick, trackUnified } from "@/hooks/useTracking";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const NAVY = "#0D1B2A";
const TEAL = "#00B4A0";
const TEAL_DARK = "#009986";
const TEXT_MUTED = "#64748B";
const SURFACE = "#F8F9FA";
const BORDER = "#E2E8F0";

const WA_URL = buildWhatsAppUrl();

const TOOLS: Array<{ n: string; name: string; Icon: typeof Calendar; body: string; highlight?: boolean }> = [
  {
    n: "01",
    name: "Agenda inteligente",
    Icon: Calendar,
    body:
      "Mais que um calendário: confirma consultas automaticamente via WhatsApp, bloqueia horários de pacientes que faltam recorrentemente e te avisa quando a agenda está mal distribuída — tipo 3 horas vagas no meio do dia que poderiam estar gerando faturamento.",
  },
  {
    n: "02",
    name: "Prontuário eletrônico",
    Icon: FileText,
    body:
      "Prontuário 100% LGPD-compliant com templates por especialidade, anexos, evolução clínica e histórico completo do paciente. Você acessa de qualquer dispositivo, nunca perde um dado clínico — o que protege você juridicamente e melhora o atendimento.",
  },
  {
    n: "03",
    name: "Prescrição digital",
    Icon: PenTool,
    body:
      "Receitas válidas em todo o Brasil conforme ANVISA RDC 471/2021, com assinatura digital integrada. O paciente recebe direto no WhatsApp ou e-mail. Você economiza tempo de impressão e elimina o risco de receita extraviada.",
  },
  {
    n: "04",
    name: "Teleconsulta integrada",
    Icon: Video,
    body:
      "Vídeo direto pelo navegador do paciente, sem instalar nada, conforme CFM 2.314/2022. Já vem com prontuário, agenda e prescrição na mesma tela — você atende sem ficar pulando entre sistemas.",
  },
  {
    n: "05",
    name: "Inteligência financeira",
    Icon: LineChart,
    highlight: true,
    body:
      "Nosso diferencial. A IA analisa todos os dados do seu consultório (agenda, ticket, custos, taxas) e te entrega em tempo real: quanto cada procedimento realmente lucra, quais preços ajustar, qual a previsão de faturamento e onde está vazando dinheiro. É como ter um CFO sênior por uma fração do custo.",
  },
  {
    n: "06",
    name: "Gestão fiscal automática",
    Icon: Receipt,
    body:
      "Emissão de NFS-e, recibos médicos, controle de receitas e despesas dedutíveis. No fim do mês, você exporta um relatório pronto pro contador em 1 clique — e ainda recebe alertas de quando está chegando perto do limite do MEI ou Simples Nacional.",
  },
  {
    n: "07",
    name: "WhatsApp automatizado",
    Icon: MessageCircle,
    body:
      "Confirmação de agendamento, lembrete 24h antes, mensagem de retorno pós-consulta e pesquisa de satisfação — tudo automático e personalizado com o nome do paciente. Reduz no-show em até 60%.",
  },
  {
    n: "08",
    name: "Painel de gestão em tempo real",
    Icon: LayoutDashboard,
    body:
      "Dashboard único com todos os indicadores que importam: faturamento do dia, ticket médio, taxa de ocupação da agenda, pacientes em risco de evasão e metas mensais. Você abre o app de manhã e em 30 segundos sabe se o consultório está no rumo certo.",
  },
];

const AllToolsSection = () => {
  return (
    <section
      aria-labelledby="all-tools-title"
      style={{
        background: SURFACE,
        padding: "96px 0",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        .tool-row {
          display: grid;
          grid-template-columns: minmax(220px, 35%) 1fr;
          gap: 32px;
          padding: 28px;
          background: #FFFFFF;
          border: 1px solid ${BORDER};
          border-radius: 16px;
          align-items: flex-start;
          transition: box-shadow 200ms ease, transform 200ms ease;
        }
        .tool-row:hover { box-shadow: 0 14px 32px rgba(13,27,42,0.06); transform: translateY(-2px); }
        .tool-row.highlight { border-color: ${TEAL}; box-shadow: 0 10px 28px rgba(0,180,160,0.12); }
        .tool-num {
          color: ${TEAL}; font-weight: 800; font-size: 32px; letter-spacing: -0.04em;
          line-height: 1; font-variant-numeric: tabular-nums;
        }
        .tool-icon-circle {
          display: inline-flex; align-items: center; justify-content: center;
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(0,180,160,0.12); color: ${TEAL};
        }
        .tool-cta {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          background: ${TEAL}; color: #FFFFFF;
          font-weight: 700; font-size: 16px;
          padding: 18px 32px; border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0,180,160,0.28);
          transition: background 180ms ease, transform 180ms ease;
          min-height: 56px; text-decoration: none;
        }
        .tool-cta:hover { background: ${TEAL_DARK}; transform: translateY(-1px); }
        .tool-wa-link { color: ${TEAL}; font-weight: 600; font-size: 15px; }
        .tool-wa-link:hover { text-decoration: underline; text-underline-offset: 4px; }

        @media (max-width: 720px) {
          .tool-row { grid-template-columns: 1fr; gap: 16px; padding: 22px; }
        }
      `}</style>

      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <p
          style={{
            textAlign: "center",
            color: TEAL,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          Plataforma completa
        </p>

        <h2
          id="all-tools-title"
          style={{
            textAlign: "center",
            color: NAVY,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.12,
            fontSize: "clamp(28px, 4.5vw, 44px)",
            margin: 0,
          }}
        >
          Tudo o que seu consultório precisa em <span style={{ color: TEAL }}>um só lugar</span>
        </h2>

        <p
          style={{
            textAlign: "center",
            color: TEXT_MUTED,
            fontSize: 17,
            lineHeight: 1.55,
            marginTop: 16,
            maxWidth: 720,
            marginInline: "auto",
          }}
        >
          Pare de pagar 5 sistemas diferentes que não conversam entre si. A SalbCare reúne tudo numa plataforma construída por quem entende o profissional autônomo.
        </p>

        <div style={{ marginTop: 56, display: "grid", gap: 14 }}>
          {TOOLS.map((t) => {
            const Icon = t.Icon;
            return (
              <article key={t.n} className={`tool-row ${t.highlight ? "highlight" : ""}`}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <span className="tool-num" aria-hidden>{t.n}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="tool-icon-circle" aria-hidden>
                      <Icon size={22} strokeWidth={2.2} />
                    </span>
                    <h3 style={{ color: NAVY, fontWeight: 700, fontSize: 17.5, lineHeight: 1.3, margin: 0 }}>
                      {t.name}
                    </h3>
                  </div>
                  {t.highlight && (
                    <span
                      style={{
                        display: "inline-block", alignSelf: "flex-start",
                        background: "rgba(0,180,160,0.12)", color: TEAL,
                        fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
                        textTransform: "uppercase", padding: "4px 10px", borderRadius: 999,
                      }}
                    >
                      Diferencial
                    </span>
                  )}
                </div>

                <p style={{ color: TEXT_MUTED, fontSize: 15.5, lineHeight: 1.65, margin: 0 }}>
                  {t.body}
                </p>
              </article>
            );
          })}
        </div>

        {/* CTA final */}
        <div style={{ marginTop: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
          <span style={{ width: 60, height: 2, background: TEAL, borderRadius: 2 }} aria-hidden />
          <p style={{ color: NAVY, fontSize: 19, fontWeight: 600, maxWidth: 560, lineHeight: 1.4, margin: 0 }}>
            Quer ver tudo isso funcionando no seu consultório?
          </p>

          <Link
            to="/register?source=landing-all-tools"
            onClick={() => {
              trackCtaClick("agendar_demo", "landing_all_tools");
              trackUnified("landing_cta_click", { cta_name: "agendar_demo", cta_location: "landing_all_tools" });
            }}
            className="tool-cta"
          >
            Começar gratuitamente
          </Link>

          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tool-wa-link"
            onClick={() => trackCtaClick("whatsapp", "landing_all_tools")}
          >
            Prefere conversar primeiro? Chama no WhatsApp →
          </a>
        </div>
      </div>
    </section>
  );
};

export default AllToolsSection;
