import { useEffect, useRef, useState } from "react";
import inicio from "@/assets/screens/inicio.webp";
import agenda from "@/assets/screens/agenda.webp";
import pacientes from "@/assets/screens/pacientes.webp";
import financeiro from "@/assets/screens/financeiro.webp";
import { CREAM, MONO, TEAL } from "./brand";

const SCREENS = [
  { src: inicio, title: "Início", line: "Seu dia resumido em uma tela." },
  { src: agenda, title: "Agenda", line: "Os atendimentos do dia, em ordem." },
  { src: pacientes, title: "Pacientes", line: "Contato e histórico organizados." },
  { src: financeiro, title: "Financeiro", line: "Receitas, despesas e resultado." },
];

export const proScreensStyles = `
  .screens-track {
    display: flex;
    gap: 18px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: 4px 0 8px;
  }
  .screens-track::-webkit-scrollbar { display: none; }
  .screens-slide {
    flex: 0 0 auto;
    scroll-snap-align: center;
    width: 232px;
  }
  .screens-phone {
    border-radius: 30px;
    border: 1px solid rgba(10,22,40,0.18);
    background: #0B1F3A;
    padding: 8px;
    box-shadow: 0 18px 40px rgba(10,22,40,0.14);
  }
  .screens-phone img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 24px;
  }
  .screens-caption { margin-top: 12px; }
  .screens-dots { display: flex; gap: 8px; justify-content: center; margin-top: 14px; }
  .screens-dot {
    width: 30px; height: 30px; min-width: 30px;
    display: inline-flex; align-items: center; justify-content: center;
    background: none; border: none; padding: 0; cursor: pointer;
  }
  .screens-dot span {
    display: block; width: 8px; height: 8px; border-radius: 999px;
    background: rgba(10,22,40,0.24); transition: all 150ms ease;
  }
  .screens-dot[aria-current="true"] span { width: 22px; background: ${TEAL}; }
  @media (min-width: 900px) {
    .screens-slide { width: 264px; }
  }
`;

/** Carrossel com prints reais do app, navegável por arraste ou pelas bolinhas. */
const ProScreensCarousel = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const slides = Array.from(el.querySelectorAll<HTMLElement>(".screens-slide"));
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (i: number) => {
    const el = trackRef.current;
    const slide = el?.querySelectorAll<HTMLElement>(".screens-slide")[i];
    if (!el || !slide) return;
    el.scrollTo({ left: slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2, behavior: "smooth" });
  };

  return (
    <div>
      <div className="screens-track" ref={trackRef} role="group" aria-label="Telas reais do aplicativo">
        {SCREENS.map((s) => (
          <div className="screens-slide" key={s.title}>
            <div className="screens-phone">
              <img src={s.src} alt={`Tela ${s.title} do SalbCare no celular`} loading="lazy" decoding="async" />
            </div>
            <div className="screens-caption">
              <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.08em", color: TEAL }}>
                {s.title.toUpperCase()}
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, color: CREAM, opacity: 0.8 }}>{s.line}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="screens-dots">
        {SCREENS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            className="screens-dot"
            aria-current={active === i}
            aria-label={`Ver tela ${s.title}`}
            onClick={() => goTo(i)}
          >
            <span />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProScreensCarousel;
