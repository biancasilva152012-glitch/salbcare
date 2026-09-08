/**
 * Demonstração interativa do painel na landing /pro.
 * Sem login e sem banco: todos os dados são fictícios e vivem só neste estado.
 * Depois de três ações, aparece um convite discreto para criar o painel real.
 */
import { useMemo, useState } from "react";
import { CREAM, GOLD, MONO, TEAL } from "./brand";

type Tab = "agenda" | "pacientes" | "financeiro";

type Appt = { id: number; hora: string; nome: string; feito: boolean };
type Paciente = { id: number; nome: string; contato: string; obs: string };
type Lanc = { id: number; desc: string; valor: number; tipo: "entrada" | "saida" };

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const TABS: { key: Tab; label: string }[] = [
  { key: "agenda", label: "Agenda" },
  { key: "pacientes", label: "Pacientes" },
  { key: "financeiro", label: "Financeiro" },
];

const ProSandbox = ({ onTrial }: { onTrial: () => void }) => {
  const [tab, setTab] = useState<Tab>("agenda");
  const [actions, setActions] = useState(0);
  const [appts, setAppts] = useState<Appt[]>([
    { id: 1, hora: "08:30", nome: "Ana Ribeiro", feito: false },
    { id: 2, hora: "10:00", nome: "Carlos Menezes", feito: false },
    { id: 3, hora: "14:15", nome: "Juliana Prado", feito: false },
  ]);
  const [pacientes, setPacientes] = useState<Paciente[]>([
    { id: 1, nome: "Ana Ribeiro", contato: "(88) 9 9999-1010", obs: "Retorno de avaliação" },
    { id: 2, nome: "Carlos Menezes", contato: "(88) 9 9888-2020", obs: "Fisioterapia de ombro" },
  ]);
  const [lancs, setLancs] = useState<Lanc[]>([
    { id: 1, desc: "Consulta Ana Ribeiro", valor: 180, tipo: "entrada" },
    { id: 2, desc: "Consulta Carlos Menezes", valor: 220, tipo: "entrada" },
    { id: 3, desc: "Material de consultório", valor: 100, tipo: "saida" },
  ]);
  const [novoPaciente, setNovoPaciente] = useState("");
  const [novoValor, setNovoValor] = useState("");

  const act = () => setActions((n) => n + 1);

  const resultado = useMemo(
    () => lancs.reduce((acc, l) => acc + (l.tipo === "entrada" ? l.valor : -l.valor), 0),
    [lancs],
  );
  const entradas = useMemo(
    () => lancs.filter((l) => l.tipo === "entrada").reduce((a, l) => a + l.valor, 0),
    [lancs],
  );

  const addPaciente = () => {
    const nome = novoPaciente.trim();
    if (!nome) return;
    setPacientes((p) => [{ id: Date.now(), nome, contato: "a preencher", obs: "primeira consulta" }, ...p]);
    setNovoPaciente("");
    act();
  };

  const addLanc = () => {
    const valor = Number(novoValor.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) return;
    setLancs((l) => [{ id: Date.now(), desc: "Consulta particular", valor, tipo: "entrada" }, ...l]);
    setNovoValor("");
    act();
  };

  return (
    <div className="pro-card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: 12,
          borderBottom: "1px solid rgba(31,31,31,0.12)",
          flexWrap: "wrap",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              act();
            }}
            style={{
              fontFamily: MONO,
              fontSize: 11.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "9px 14px",
              borderRadius: 999,
              cursor: "pointer",
              border: tab === t.key ? "1px solid rgba(31,31,31,0.22)" : "1px solid transparent",
              background: tab === t.key ? "#FFFFFF" : "transparent",
              color: CREAM,
            }}
            aria-pressed={tab === t.key}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 18, display: "grid", gap: 14 }}>
        {tab === "agenda" && (
          <>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: TEAL, textTransform: "uppercase" }}>
              Atendimentos de hoje
            </div>
            {appts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAppts((list) => list.map((x) => (x.id === a.id ? { ...x, feito: !x.feito } : x)));
                  act();
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  width: "100%",
                  textAlign: "left",
                  fontFamily: MONO,
                  fontSize: 12.5,
                  padding: "11px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  border: "1px solid rgba(31,31,31,0.12)",
                  background: a.feito ? "rgba(45,212,191,0.10)" : "#FFFFFF",
                  color: CREAM,
                }}
              >
                <span>
                  {a.hora} · {a.nome}
                </span>
                <span style={{ color: a.feito ? TEAL : "rgba(31,31,31,0.5)" }}>
                  {a.feito ? "atendido" : "marcar como atendido"}
                </span>
              </button>
            ))}
          </>
        )}

        {tab === "pacientes" && (
          <>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: TEAL, textTransform: "uppercase" }}>
              Pacientes
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                className="pro-input"
                style={{ flex: "1 1 180px" }}
                placeholder="Nome do paciente"
                value={novoPaciente}
                aria-label="Nome do paciente"
                onChange={(e) => setNovoPaciente(e.target.value)}
              />
              <button type="button" className="pro-cta" onClick={addPaciente}>
                Adicionar
              </button>
            </div>
            {pacientes.map((p) => (
              <div
                key={p.id}
                style={{
                  border: "1px solid rgba(31,31,31,0.12)",
                  borderRadius: 10,
                  padding: "11px 12px",
                  fontFamily: MONO,
                  fontSize: 12.5,
                  background: "#FFFFFF",
                }}
              >
                <div>{p.nome}</div>
                <div style={{ color: "rgba(31,31,31,0.6)", marginTop: 4 }}>
                  {p.contato} · {p.obs}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "financeiro" && (
          <>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: TEAL, textTransform: "uppercase" }}>
              Este mês
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                className="pro-input"
                style={{ flex: "1 1 160px" }}
                placeholder="Valor recebido"
                inputMode="decimal"
                aria-label="Valor recebido"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
              />
              <button type="button" className="pro-cta" onClick={addLanc}>
                Lançar
              </button>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12.5, color: "rgba(31,31,31,0.7)" }}>
              Entradas: {brl(entradas)}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 14, color: GOLD }}>Resultado: {brl(resultado)}</div>
            {lancs.slice(0, 4).map((l) => (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  fontFamily: MONO,
                  fontSize: 12.5,
                  borderTop: "1px solid rgba(31,31,31,0.12)",
                  paddingTop: 9,
                }}
              >
                <span>{l.desc}</span>
                <span>
                  {l.tipo === "saida" ? "- " : "+ "}
                  {brl(l.valor)}
                </span>
              </div>
            ))}
          </>
        )}

        {actions >= 3 && (
          <div
            style={{
              marginTop: 6,
              borderTop: "1px solid rgba(31,31,31,0.12)",
              paddingTop: 16,
              display: "grid",
              gap: 12,
            }}
          >
            <p className="pro-body" style={{ margin: 0 }}>
              Gostou? Seu painel real leva cerca de 10 minutos para configurar.
            </p>
            <button type="button" className="pro-cta" onClick={onTrial} style={{ justifySelf: "start" }}>
              Testar 7 dias grátis, sem cartão de crédito
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProSandbox;
