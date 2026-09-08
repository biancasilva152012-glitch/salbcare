/**
 * Acesso aos materiais da Academy sem conta.
 * O token recebido por e-mail depois da compra fica salvo neste aparelho, junto com
 * os idiomas liberados e os links de download dos PDFs.
 */
const KEY = "salbcare_academy_tokens";
const PDF_CACHE = "salbcare-academy-pdf";

export type AcademyDownload = { title: string; url: string };

export type AcademyToken = {
  token: string;
  slug: string;
  expiresAt?: string;
  langs?: string[];
  downloads?: AcademyDownload[];
};

export const getAcademyTokens = (): AcademyToken[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as AcademyToken[]) : [];
    return list.filter((t) => !t.expiresAt || new Date(t.expiresAt).getTime() > Date.now());
  } catch {
    return [];
  }
};

export const saveAcademyToken = (entry: AcademyToken) => {
  try {
    const next = [...getAcademyTokens().filter((t) => t.token !== entry.token), entry];
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* armazenamento indisponível */
  }
};

export const hasLocalAcademyAccess = () => getAcademyTokens().length > 0;

/** Idiomas liberados pelas compras salvas neste aparelho. */
export const localAcademyLangs = (): string[] => {
  const set = new Set<string>();
  getAcademyTokens().forEach((t) => (t.langs ?? ["pt"]).forEach((l) => set.add(l)));
  return [...set];
};

/** Materiais comprados salvos neste aparelho. */
export const localAcademyDownloads = (): AcademyDownload[] =>
  getAcademyTokens().flatMap((t) => t.downloads ?? []);

/**
 * Guarda o PDF no cache do app para abrir offline, sem depender do e-mail nem da rede.
 * A chave ignora a assinatura da URL, igual ao service worker.
 */
export const cacheAcademyPdf = async (url: string) => {
  if (typeof caches === "undefined") return false;
  try {
    const u = new URL(url);
    const key = u.origin + u.pathname;
    const cache = await caches.open(PDF_CACHE);
    if (await cache.match(key)) return true;
    const res = await fetch(url);
    if (!res.ok) return false;
    await cache.put(key, res.clone());
    return true;
  } catch {
    return false;
  }
};

export const isAcademyPdfCached = async (url: string) => {
  if (typeof caches === "undefined") return false;
  try {
    const u = new URL(url);
    const cache = await caches.open(PDF_CACHE);
    return !!(await cache.match(u.origin + u.pathname));
  } catch {
    return false;
  }
};

/** URL local do PDF já guardado, para abrir mesmo sem conexão. */
export const offlineAcademyPdfUrl = async (url: string) => {
  if (typeof caches === "undefined") return null;
  try {
    const u = new URL(url);
    const cache = await caches.open(PDF_CACHE);
    const hit = await cache.match(u.origin + u.pathname);
    if (!hit) return null;
    return URL.createObjectURL(await hit.blob());
  } catch {
    return null;
  }
};
