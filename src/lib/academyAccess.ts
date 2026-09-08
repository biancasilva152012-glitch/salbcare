/**
 * Acesso aos materiais da Academy sem conta.
 * O token recebido por e-mail depois da compra fica salvo neste aparelho.
 */
const KEY = "salbcare_academy_tokens";

export type AcademyToken = { token: string; slug: string; expiresAt?: string };

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
