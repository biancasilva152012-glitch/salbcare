import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LocalPartnerNetwork from "../LocalPartnerNetwork";

const partnersFixture = [
  {
    id: "p-bianca",
    name: "Dra. Bianca S. de Albuquerque",
    category: "doctor",
    subcategory: null,
    location: "Ilha do Guajiru",
    description: "Médica dedicada ao cuidado da comunidade.",
    description_en: "Doctor devoted to community care.",
    description_es: "Médica dedicada al cuidado de la comunidad.",
    image_url: "https://example.com/bianca.jpg",
    whatsapp: "5588996924700",
    instagram: null,
    website: null,
    featured: true,
  },
  {
    id: "p-sarah",
    name: "Dra. Sarah Teixeira Almeida",
    category: "dental",
    subcategory: null,
    location: "Itarema",
    description: "Odontologia integrativa.",
    description_en: "Integrative dentistry.",
    description_es: "Odontología integrativa.",
    image_url: "https://example.com/sarah.jpg",
    whatsapp: "5588996924700",
    instagram: null,
    website: null,
    featured: false,
  },
];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (_table: string) => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        then: (onFulfilled: any) =>
          Promise.resolve({ data: partnersFixture, error: null }).then(onFulfilled),
      };
      return chain;
    },
  },
}));

const renderNet = (lang: "pt" | "en" | "es") => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <LocalPartnerNetwork lang={lang} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("LocalPartnerNetwork", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders partner cards with images centered on the face (object-cover + top-anchored)", async () => {
    renderNet("pt");
    await waitFor(() => {
      expect(screen.getByText("Dra. Bianca S. de Albuquerque")).toBeInTheDocument();
    });

    const bianca = screen.getByAltText(/Dra\. Bianca S\. de Albuquerque/i) as HTMLImageElement;
    expect(bianca).toBeInTheDocument();
    expect(bianca.src).toContain("bianca.jpg");
    expect(bianca.className).toContain("object-cover");
    expect(bianca.className).toContain("w-full");
    expect(bianca.className).toContain("h-full");
    // Face-centered framing (anchored toward the top of the portrait)
    expect(bianca.style.objectPosition).toMatch(/center\s+25%/i);
    expect(bianca.getAttribute("loading")).toBe("lazy");
    expect(bianca.getAttribute("decoding")).toBe("async");
  });

  it("renders in Portuguese with the localized CTA", async () => {
    renderNet("pt");
    await waitFor(() => screen.getByText(/Tudo que você precisa/i));
    expect(screen.getByRole("link", { name: /Torne-se parceiro/i })).toHaveAttribute(
      "href",
      "/partnership",
    );
  });

  it("renders in English with the localized CTA", async () => {
    renderNet("en");
    await waitFor(() => screen.getByText(/Everything you need/i));
    expect(screen.getByRole("link", { name: /Become a Partner/i })).toBeInTheDocument();
  });

  it("renders in Spanish with the localized CTA", async () => {
    renderNet("es");
    await waitFor(() => screen.getByText(/Todo lo que necesitas/i));
    expect(screen.getByRole("link", { name: /Conviértete en socio/i })).toBeInTheDocument();
  });

  it("uses a fixed-height image container so photos never distort", async () => {
    const { container } = renderNet("pt");
    await waitFor(() => screen.getByText("Dra. Sarah Teixeira Almeida"));
    // Every partner card image sits inside a wrapper button with a fixed height
    const imgs = container.querySelectorAll("img[alt*='Dra.'], img[alt*='Clínica']");
    imgs.forEach((img) => {
      const wrapper = img.closest("button");
      expect(wrapper).not.toBeNull();
      expect(wrapper!.className).toMatch(/h-48/);
      expect(wrapper!.className).toMatch(/overflow-hidden/);
    });
  });

  it("exposes an accessible carousel region with slide semantics", async () => {
    renderNet("pt");
    await waitFor(() => screen.getByText("Dra. Bianca S. de Albuquerque"));
    const region = screen.getByRole("region", { name: /Parceiros da SalbCare/i });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    const slides = within(region).getAllByRole("group");
    expect(slides.length).toBeGreaterThanOrEqual(2);
    expect(slides[0]).toHaveAttribute("aria-roledescription", "slide");
  });
});
