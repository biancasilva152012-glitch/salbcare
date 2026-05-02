import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { maskCurrency, parseBRL } from "@/utils/currencyMask";
import { trackCtaClick, trackUnified } from "@/hooks/useTracking";

/* Tokens da landing — manter consistência visual */
const NAVY = "#0D1B2A";
const TEAL = "#00B4A0";
const TEXT_MUTED = "#64748B";
const BORDER = "#E2E8F0";

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  prefix = "R$",
  numericOnly = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  prefix?: string;
  numericOnly?: boolean;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium" style={{ color: TEXT_MUTED }}>
      {label}
    </label>
    <div className="relative">
      {!numericOnly && (
        <span
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs"
          style={{ color: `${TEXT_MUTED}99` }}
        >
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) =>
          onChange(numericOnly ? e.target.value.replace(/\D/g, "") : maskCurrency(e.target.value))
        }
        className={`h-11 w-full rounded-lg border bg-white text-sm font-medium outline-none focus:ring-2 ${
          numericOnly ? "px-4" : "pl-10 pr-4"
        }`}
        style={
          {
            borderColor: BORDER,
            color: NAVY,
            ["--tw-ring-color" as never]: `${TEAL}33`,
          } as React.CSSProperties
        }
      />
    </div>
  </div>
);

const PricingCalculatorSection = () => {
  const [custoFixo, setCustoFixo] = useState("");
  const [custoVariavel, setCustoVariavel] = useState("");
  const [consultas, setConsultas] = useState("");
  const [margem, setMargem] = useState("30");

  const result = useMemo(() => {
    const fixo = parseBRL(custoFixo);
    const variavel = parseBRL(custoVariavel);
    const qtd = parseInt(consultas.replace(/\D/g, ""), 10) || 0;
    const m = Math.min(parseInt(margem.replace(/\D/g, ""), 10) || 0, 95);
    if (qtd === 0) return null;
    const custoTotal = fixo + variavel;
    const minimo = custoTotal / qtd;
    const sugerido = minimo / (1 - m / 100);
    const lucroMes = sugerido * qtd - custoTotal;
    return { minimo, sugerido, lucroMes, custoTotal };
  }, [custoFixo, custoVariavel, consultas, margem]);

  const handleCta = () => {
    trackCtaClick("calculadora_quero_organizar", "pricing_calculator");
    trackUnified("landing_cta_click", {
      cta_name: "calculadora_quero_organizar",
      cta_location: "pricing_calculator",
    });
  };

  return (
    <section
      className="px-4 py-16 md:py-24"
      style={{ backgroundColor: "#F8FAFC" }}
      aria-labelledby="calc-precificacao-title"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${TEAL}1A`, color: TEAL }}
          >
            Exemplo prático
          </span>
          <h2
            id="calc-precificacao-title"
            className="mt-4 text-3xl font-bold leading-tight md:text-4xl"
            style={{ color: NAVY }}
          >
            Veja na prática quanto sua consulta deveria custar
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base" style={{ color: TEXT_MUTED }}>
            Uma amostra grátis de como a SalbCare calcula precificação e contabilidade automaticamente.
            Preencha seus números reais — nada fica salvo.
          </p>
        </div>

        <div
          className="grid gap-6 rounded-2xl border bg-white p-6 shadow-sm md:grid-cols-2 md:p-8"
          style={{ borderColor: BORDER }}
        >
          {/* Inputs */}
          <div className="space-y-4">
            <Field
              label="Custos fixos mensais (aluguel, software, internet…)"
              value={custoFixo}
              onChange={setCustoFixo}
              placeholder="2.500"
            />
            <Field
              label="Custos variáveis mensais (materiais, deslocamento…)"
              value={custoVariavel}
              onChange={setCustoVariavel}
              placeholder="500"
            />
            <Field
              label="Consultas por mês"
              value={consultas}
              onChange={setConsultas}
              placeholder="40"
              numericOnly
            />
            <Field
              label="Margem de lucro desejada (%)"
              value={margem}
              onChange={setMargem}
              placeholder="30"
              numericOnly
            />
          </div>

          {/* Resultado */}
          <div
            className="flex flex-col justify-between rounded-xl p-6"
            style={{ backgroundColor: result ? `${TEAL}0D` : "#F1F5F9" }}
          >
            {result ? (
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
                    Preço mínimo (cobre os custos)
                  </p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: NAVY }}>
                    {fmtBRL(result.minimo)}
                  </p>
                  <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                    Abaixo disso, você está tendo prejuízo.
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
                    Preço sugerido (com margem)
                  </p>
                  <p className="mt-1 text-4xl font-extrabold" style={{ color: TEAL }}>
                    {fmtBRL(result.sugerido)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: BORDER }}>
                  <div>
                    <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                      Custo total / mês
                    </p>
                    <p className="text-base font-semibold" style={{ color: NAVY }}>
                      {fmtBRL(result.custoTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                      Lucro estimado / mês
                    </p>
                    <p className="text-base font-semibold" style={{ color: TEAL }}>
                      {fmtBRL(Math.max(result.lucroMes, 0))}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-sm font-medium" style={{ color: NAVY }}>
                  Preencha seus custos e o número de consultas
                </p>
                <p className="mt-2 text-xs" style={{ color: TEXT_MUTED }}>
                  O preço mínimo e sugerido aparecem aqui automaticamente.
                </p>
              </div>
            )}

            <Link
              to="/register"
              onClick={handleCta}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: TEAL }}
            >
              Quero organizar tudo isso na SalbCare
            </Link>
            <p className="mt-2 text-center text-[11px]" style={{ color: TEXT_MUTED }}>
              Dentro da plataforma, contabilidade, impostos e fluxo de caixa são calculados sozinhos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingCalculatorSection;
