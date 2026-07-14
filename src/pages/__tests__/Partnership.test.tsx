import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Partnership from "../Partnership";

const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Partnership />
      </MemoryRouter>
    </HelmetProvider>,
  );

const switchTo = (lang: "pt" | "en" | "es") => {
  const group = screen.getByRole("group", { name: /language/i });
  fireEvent.click(within(group).getByRole("button", { name: new RegExp(`^${lang}$`, "i") }));
};

describe("Partnership page — multilingual content", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders in Portuguese with all sections translated", () => {
    window.localStorage.setItem("salbcare_lang", "pt");
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Torne-se Parceiro SalbCare");
    expect(screen.getByText(/Você é um profissional de saúde/i)).toBeInTheDocument();
    expect(screen.getByText(/Selecionamos nossos parceiros com cuidado/i)).toBeInTheDocument();
    expect(screen.getByText("Rede curada")).toBeInTheDocument();
    expect(screen.getByText("Alcance internacional")).toBeInTheDocument();
    expect(screen.getByText("Concierge de confiança")).toBeInTheDocument();
    expect(screen.getByText(/Onde você estiver/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voltar/i })).toBeInTheDocument();
  });

  it("renders in English when switched", () => {
    window.localStorage.setItem("salbcare_lang", "en");
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Become a SalbCare Partner");
    expect(screen.getByText(/Are you a healthcare professional/i)).toBeInTheDocument();
    expect(screen.getByText("Curated network")).toBeInTheDocument();
    expect(screen.getByText("International reach")).toBeInTheDocument();
    expect(screen.getByText("Trusted concierge")).toBeInTheDocument();
    expect(screen.getByText(/Wherever you are/i)).toBeInTheDocument();
  });

  it("renders in Spanish when switched", () => {
    window.localStorage.setItem("salbcare_lang", "es");
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Conviértete en Socio SalbCare");
    expect(screen.getByText(/¿Eres un profesional de salud/i)).toBeInTheDocument();
    expect(screen.getByText("Red curada")).toBeInTheDocument();
    expect(screen.getByText(/Donde estés/i)).toBeInTheDocument();
  });

  it("switches languages via the header selector", () => {
    window.localStorage.setItem("salbcare_lang", "pt");
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Torne-se/);
    switchTo("en");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Become/);
    switchTo("es");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Conviértete/);
  });

  it("contains no leftover English strings in the Portuguese view", () => {
    window.localStorage.setItem("salbcare_lang", "pt");
    const { container } = renderPage();
    const visibleText = container.textContent ?? "";
    // Curated network / International reach are English feature titles that must not leak into PT
    expect(visibleText).not.toMatch(/Curated network/i);
    expect(visibleText).not.toMatch(/International reach/i);
    expect(visibleText).not.toMatch(/Trusted concierge/i);
    expect(visibleText).not.toMatch(/Wherever you are/i);
    expect(visibleText).not.toMatch(/Become a SalbCare Partner/i);
  });

  it("contains no leftover English strings in the Spanish view", () => {
    window.localStorage.setItem("salbcare_lang", "es");
    const { container } = renderPage();
    const visibleText = container.textContent ?? "";
    expect(visibleText).not.toMatch(/Curated network/i);
    expect(visibleText).not.toMatch(/International reach/i);
    expect(visibleText).not.toMatch(/Trusted concierge/i);
    expect(visibleText).not.toMatch(/Wherever you are/i);
    expect(visibleText).not.toMatch(/Become a SalbCare Partner/i);
  });

  it("builds WhatsApp and email links with the localized copy", () => {
    window.localStorage.setItem("salbcare_lang", "pt");
    renderPage();
    const wa = screen.getByRole("link", { name: /WhatsApp/i }) as HTMLAnchorElement;
    const mail = screen.getByRole("link", { name: /E-mail/i }) as HTMLAnchorElement;
    expect(wa.href).toContain("wa.me/5588996924700");
    expect(decodeURIComponent(wa.href)).toContain("Olá equipe SalbCare");
    expect(mail.href.startsWith("mailto:")).toBe(true);
    expect(decodeURIComponent(mail.href)).toContain("Oportunidade de Parceria SalbCare");
  });
});
