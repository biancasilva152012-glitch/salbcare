/**
 * Mockups do painel usados na landing /pro.
 * ProAgendaMini: miniatura flutuante do lado direito da hero.
 * ProPanelMock: frame único de app, com barra de topo, menu lateral com ícones,
 * conteúdo da agenda e o resumo financeiro como card secundário à direita.
 */
import {
  CalendarDays,
  CreditCard,
  FolderOpen,
  LineChart,
  UserRound,
  Users,
} from "lucide-react";
import { CREAM, DISPLAY, GOLD, MONO, NAVY, SAND, SANS, TEAL } from "./brand";

const RULE = "rgba(31,31,31,0.12)";
const RULE_TEAL = `1px solid ${TEAL}33`;

export const panelMockStyles = `
  .pm-frame {
    border: 1px solid ${RULE};
    border-radius: 14px;
    background: #FFFFFF;
    box-shadow: 0 18px 40px rgba(31,31,31,0.10);
    overflow: hidden;
  }
  .pm-topbar {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 16px; border-bottom: 1px solid ${RULE}; background: ${SAND};
  }
  .pm-body { display: grid; grid-template-columns: 168px 1fr; }
  .pm-side { border-right: 1px solid ${RULE}; padding: 14px 12px; display: grid; gap: 2px; align-content: start; }
  .pm-navitem {
    display: flex; align-items: center; gap: 9px;
    font-family: ${MONO}; font-size: 11.5px; color: rgba(31,31,31,0.7);
    padding: 8px 9px; border-radius: 8px;
  }
  .pm-navitem[data-active="true"] { background: #FFFFFF; border: 1px solid rgba(31,31,31,0.2); color: ${CREAM}; }
  .pm-main { padding: 18px; display: grid; grid-template-columns: 1.35fr 1fr; gap: 18px; align-items: start; }
  .pm-label { font-family: ${MONO}; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${TEAL}; }
  .pm-field {
    background: ${SAND}; border: ${RULE_TEAL}; border-radius: 8px;
    padding: 9px 11px; font-family: ${MONO}; font-size: 11.5px; color: rgba(31,31,31,0.78);
  }
  .pm-row {
    display: flex; justify-content: space-between; gap: 10px;
    font-family: ${MONO}; font-size: 11.5px; color: rgba(31,31,31,0.78);
    border-top: 1px solid ${RULE}; padding-top: 9px; margin-top: 9px;
  }
  .pm-aside { border: 1px solid ${RULE}; border-radius: 10px; padding: 14px; background: ${SAND}; }

  .pm-mini { transform: rotate(-1.4deg); }
  .pm-mini .pm-main { grid-template-columns: 1fr; }
  .pm-mini .pm-body { grid-template-columns: 1fr; }

  @media (max-width: 820px) {
    .pm-body { grid-template-columns: 1fr; }
    .pm-side { border-right: none; border-bottom: 1px solid ${RULE}; grid-auto-flow: row; }
    .pm-main { grid-template-columns: 1fr; padding: 14px; }
    .pm-mini { transform: none; }
  }
`;

const NAV = [
  { label: "Perfil", Icon: UserRound },
  { label: "Agenda", Icon: CalendarDays, active: true },
  { label: "Pacientes", Icon: Users },
  { label: "Financeiro", Icon: LineChart },
  { label: "Materiais", Icon: FolderOpen },
  { label: "Assinatura", Icon: CreditCard },
];

const AGENDA = [
  { hora: "08:30", nome: "Ana Ribeiro" },
  { hora: "10:00", nome: "Carlos Menezes" },
  { hora: "14:15", nome: "Juliana Prado" },
];

const TopBar = ({ breadcrumb }: { breadcrumb: string }) => (
  <div className="pm-topbar">
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <img
        src="/salbcare-logo.png"
        alt=""
        width={18}
        height={18}
        style={{ width: 18, height: 18, borderRadius: 4, display: "block" }}
        loading="lazy"
      />
      <span style={{ fontFamily: MONO, fontSize: 11, color: "rgba(31,31,31,0.68)" }}>{breadcrumb}</span>
    </span>
    <span aria-hidden style={{ display: "inline-flex", gap: 5 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{ width: 7, height: 7, borderRadius: 999, background: "rgba(31,31,31,0.16)" }}
        />
      ))}
    </span>
  </div>
);

/** Miniatura da Agenda, usada na hero. */
export const ProAgendaMini = () => (
  <div className="pm-frame pm-mini" aria-hidden style={{ fontFamily: SANS, background: NAVY }}>
    <TopBar breadcrumb="Painel > Agenda" />
    <div className="pm-body">
      <div className="pm-main" style={{ background: "#FFFFFF" }}>
        <div>
          <div className="pm-label">Próximos atendimentos</div>
          <div style={{ marginTop: 10 }}>
            {AGENDA.map((a) => (
              <div key={a.hora} className="pm-row" style={{ marginTop: 0 }}>
                <span>{a.hora}</span>
                <span>{a.nome}</span>
              </div>
            ))}
          </div>
          <div className="pm-field" style={{ marginTop: 14 }}>
            Novo atendimento
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** Frame completo do painel, usado na seção "É simples assim por dentro". */
const ProPanelMock = () => (
  <div className="pm-frame" style={{ fontFamily: SANS, background: NAVY }}>
    <TopBar breadcrumb="Consultório SalbCare · Painel > Agenda" />

    <div className="pm-body">
      <nav className="pm-side">
        {NAV.map(({ label, Icon, active }) => (
          <span key={label} className="pm-navitem" data-active={active ? "true" : "false"}>
            <Icon size={14} strokeWidth={1.6} />
            {label}
          </span>
        ))}
      </nav>

      <div className="pm-main" style={{ background: "#FFFFFF" }}>
        <div>
          <div className="pm-label">Novo atendimento</div>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <div className="pm-field">Paciente: Ana Ribeiro</div>
            <div className="pm-field">Data: 12/09/2026 · 08:30</div>
            <div className="pm-field">Observação: retorno de avaliação</div>
          </div>

          <div className="pm-label" style={{ marginTop: 20 }}>
            Próximos atendimentos
          </div>
          <div style={{ marginTop: 6 }}>
            {AGENDA.map((a) => (
              <div key={a.hora} className="pm-row">
                <span>{a.hora}</span>
                <span>{a.nome}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="pm-aside">
          <div className="pm-label">Este mês</div>
          <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 11.5, color: "rgba(31,31,31,0.7)" }}>
            Receitas
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, color: CREAM, lineHeight: 1.2 }}>R$ 1.000,00</div>
          <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 11.5, color: "rgba(31,31,31,0.7)" }}>
            Despesas
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 34, color: GOLD, lineHeight: 1.15 }}>R$ 100,00</div>
          <div className="pm-row" style={{ marginTop: 14 }}>
            <span>Resultado</span>
            <span>R$ 900,00</span>
          </div>
        </aside>
      </div>
    </div>
  </div>
);

export default ProPanelMock;
