export type AgendaItem = { id: string; date: string; time: string; appointment_type?: string; status?: string };

export const toMinutes = (t: string) => {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};
export const fromMinutes = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

/** Consultas no mesmo dia cujo intervalo [início, início+duração) cruza o novo horário. */
export function findConflicts<T extends AgendaItem>(items: T[], date: string, time: string, duration: number, ignoreId?: string | null) {
  if (!date || !time) return [];
  const start = toMinutes(time);
  const end = start + duration;
  return items.filter((a) => {
    if (a.id === ignoreId || a.date !== date || a.status === "cancelled") return false;
    const s = toMinutes(a.time);
    return s < end && start < s + duration;
  });
}

/** Próximos horários livres no dia, a partir do horário pedido (grade de 30 min, 7h às 21h). */
export function nextFreeSlots(items: AgendaItem[], date: string, fromTime: string, duration: number, count = 3, ignoreId?: string | null) {
  const out: string[] = [];
  for (let m = toMinutes(fromTime || "07:00"); m + duration <= 21 * 60 && out.length < count; m += 30) {
    const t = fromMinutes(m);
    if (findConflicts(items, date, t, duration, ignoreId).length === 0) out.push(t);
  }
  return out;
}
