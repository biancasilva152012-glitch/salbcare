import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CREAM, MONO, TEAL } from "./brand";

const SCREENS = [
  { src: "/screens/inicio.webp", title: "Início", line: "Seu dia inteiro em 30 segundos." },
  { src: "/screens/agenda.webp", title: "Agenda", line: "Marque, edite e confirme consultas em poucos toques." },
  { src: "/screens/pacientes.webp", title: "Pacientes", line: "Cada paciente a um toque." },
  { src: "/screens/financeiro.webp", title: "Financeiro", line: "Quanto entra, quanto sai, quanto sobra." },
  { src: "/screens/mentora.webp", title: "Mentora Financeira", line: "Pergunte. Ela já conhece seus números." },
  { src: "/screens/academy.webp", title: "Academy", line: "Inglês e espanhol para o atendimento, 5 minutos por dia." },
];

export const proScreensStyles = `
  .screens-shell { position: relative; }
  .screens-track {
    display: flex;
    gap: 16px;
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
    width: min(76vw, 252px);
  }
  .screens-phone {
    border-radius: 44px;
    border: 9px solid #0B1F3A;
    background: #0B1F3A;
    overflow: hidden;
    box-shadow: 0 18px 42px rgba(10,22,40,0.16);
    aspect-ratio: 390 / 844;
  }
  .screens-phone img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    border-radius: 34px;
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
  .screens-arrow { display: none; }
  @media (min-width: 900px) {
    .screens-track { gap: 22px; scroll-padding: 0; }
    .screens-slide { width: calc((100% - 44px) / 3); scroll-snap-align: start; }
    .screens-arrow {
      position: absolute; top: 38%; z-index: 2;
      display: inline-flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; border-radius: 999px;
      border: 1px solid rgba(10,22,40,0.18); background: rgba(255,255,255,0.92);
      color: ${CREAM}; cursor: pointer; box-shadow: 0 12px 24px rgba(10,22,40,0.12);
    }
    .screens-arrow-left { left: -22px; }
    .screens-arrow-right { right: -22px; }
  }
`;

export const PhoneMockup = ({
  src,
  alt,
  eager = false,
}: {
  src: string;
  alt: string;
  eager?: boolean;
}) => (
  <div className="screens-phone">
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      width={390}
      height={844}
    />
  </div>
);

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

  const move = (direction: -1 | 1) => goTo(Math.max(0, Math.min(SCREENS.length - 1, active + direction)));

  return (
    <div className="screens-shell">
      <button type="button" className="screens-arrow screens-arrow-left" aria-label="Tela anterior" onClick={() => move(-1)}>
        <ChevronLeft size={18} aria-hidden />
      </button>
      <div className="screens-track" ref={trackRef} role="group" aria-label="Telas reais do aplicativo">
        {SCREENS.map((s) => (
          <div className="screens-slide" key={s.title}>
            <PhoneMockup src={s.src} alt={`Tela ${s.title} do SalbCare no celular`} />
            <div className="screens-caption">
              <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.08em", color: TEAL }}>
                {s.title.toUpperCase()}
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, color: CREAM, opacity: 0.8 }}>{s.line}</p>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="screens-arrow screens-arrow-right" aria-label="Próxima tela" onClick={() => move(1)}>
        <ChevronRight size={18} aria-hidden />
      </button>
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
