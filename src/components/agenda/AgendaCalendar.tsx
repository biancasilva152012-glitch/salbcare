import { useMemo } from "react";
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameMonth, isToday, parse, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { findConflicts, fromMinutes, toMinutes } from "@/lib/agenda/availability";

export type CalendarView = "dia" | "semana" | "mes";
export type CalAppointment = {
  id: string; patient_name: string; date: string; time: string; appointment_type: string; status: string;
};

type Props = {
  view: CalendarView;
  cursor: Date;
  onCursor: (d: Date) => void;
  onView: (v: CalendarView) => void;
  appointments: CalAppointment[];
  duration: number;
  onSelect: (id: string) => void;
  onSlot: (date: string, time: string) => void;
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h às 20h
const key = (d: Date) => format(d, "yyyy-MM-dd");

const statusClass = (a: CalAppointment) => {
  if (a.appointment_type === "blocked") return "bg-muted text-muted-foreground line-through";
  if (a.status === "completed") return "bg-emerald-50 text-emerald-900 border-l-emerald-600";
  if (a.status === "no_show") return "bg-red-50 text-red-900 border-l-red-600";
  if (a.status === "confirmed") return "bg-teal-50 text-teal-900 border-l-teal-600";
  if (a.status?.startsWith("aguardando")) return "bg-amber-50 text-amber-900 border-l-amber-500";
  return "bg-card text-foreground border-l-primary";
};

const AgendaCalendar = ({ view, cursor, onCursor, onView, appointments, duration, onSelect, onSlot }: Props) => {
  const byDate = useMemo(() => {
    const m: Record<string, CalAppointment[]> = {};
    appointments.forEach((a) => (m[a.date] = m[a.date] || []).push(a));
    Object.values(m).forEach((l) => l.sort((a, b) => a.time.localeCompare(b.time)));
    return m;
  }, [appointments]);

  const isConflict = (a: CalAppointment) =>
    a.appointment_type !== "blocked" && findConflicts(appointments, a.date, a.time, duration, a.id).length > 0;

  const step = (dir: 1 | -1) => {
    if (view === "dia") onCursor(addDays(cursor, dir));
    else if (view === "semana") onCursor(addDays(cursor, 7 * dir));
    else onCursor(addMonths(cursor, dir));
  };

  const title =
    view === "dia"
      ? format(cursor, "EEEE, d 'de' MMMM", { locale: ptBR })
      : view === "semana"
      ? `${format(startOfWeek(cursor, { weekStartsOn: 1 }), "d MMM", { locale: ptBR })} a ${format(endOfWeek(cursor, { weekStartsOn: 1 }), "d MMM", { locale: ptBR })}`
      : format(cursor, "MMMM 'de' yyyy", { locale: ptBR });

  const Chip = ({ a }: { a: CalAppointment }) => (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onSelect(a.id); }}
      className={cn("w-full truncate rounded-md border border-border border-l-[3px] px-2 py-1.5 text-left text-xs", statusClass(a), isConflict(a) && "ring-1 ring-destructive")}
    >
      <span className="font-mono">{a.time.slice(0, 5)}</span> {a.appointment_type === "blocked" ? "Bloqueado" : a.patient_name}
      {isConflict(a) && <span className="ml-1 font-semibold text-destructive">Sobreposta</span>}
    </button>
  );

  const DayColumn = ({ day, compact }: { day: Date; compact?: boolean }) => {
    const list = byDate[key(day)] || [];
    return (
      <div className="divide-y divide-border">
        {HOURS.map((h) => {
          const inHour = list.filter((a) => Math.floor(toMinutes(a.time) / 60) === h);
          return (
            <div
              key={h}
              role="button"
              tabIndex={0}
              aria-label={`Novo agendamento ${format(day, "dd/MM")} às ${h}h`}
              onClick={() => onSlot(key(day), fromMinutes(h * 60))}
              className={cn("flex min-h-12 gap-2 px-1 py-1 hover:bg-muted/50 cursor-pointer", compact && "min-h-10")}
            >
              {!compact && <span className="w-10 shrink-0 pt-1 font-mono text-[11px] text-muted-foreground">{String(h).padStart(2, "0")}:00</span>}
              <div className="flex min-w-0 flex-1 flex-col gap-1">{inHour.map((a) => <Chip key={a.id} a={a} />)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor, { weekStartsOn: 1 }), i));
  const monthDays: Date[] = [];
  for (let d = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }); d <= endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }); d = addDays(d, 1)) monthDays.push(d);

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg bg-muted p-1">
        {(["dia", "semana", "mes"] as CalendarView[]).map((v) => (
          <button key={v} onClick={() => onView(v)} className={cn("flex-1 rounded-md py-2 text-xs font-medium", view === v ? "bg-background shadow-sm" : "text-muted-foreground")}>
            {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button size="icon" variant="outline" onClick={() => step(-1)} aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold capitalize">{title}</p>
          <button className="text-xs text-primary underline-offset-2 hover:underline" onClick={() => onCursor(new Date())}>Hoje</button>
        </div>
        <Button size="icon" variant="outline" onClick={() => step(1)} aria-label="Próximo"><ChevronRight className="h-4 w-4" /></Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {view === "dia" && <DayColumn day={cursor} />}

        {view === "semana" && (
          <>
            {/* Celular: lista por dia */}
            <div className="divide-y divide-border md:hidden">
              {weekDays.map((d) => {
                const list = byDate[key(d)] || [];
                return (
                  <div key={key(d)} className="p-2">
                    <button onClick={() => { onCursor(d); onView("dia"); }} className={cn("mb-1 text-xs font-semibold capitalize", isToday(d) ? "text-primary" : "text-muted-foreground")}>
                      {format(d, "EEE, d", { locale: ptBR })}
                    </button>
                    <div className="space-y-1">
                      {list.length === 0 ? (
                        <button onClick={() => onSlot(key(d), "09:00")} className="w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground">Livre. Tocar para agendar</button>
                      ) : list.map((a) => <Chip key={a.id} a={a} />)}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop: 7 colunas */}
            <div className="hidden grid-cols-7 divide-x divide-border md:grid">
              {weekDays.map((d) => (
                <div key={key(d)} className="min-w-0">
                  <p className={cn("border-b border-border py-2 text-center text-xs font-semibold capitalize", isToday(d) && "text-primary")}>{format(d, "EEE d", { locale: ptBR })}</p>
                  <DayColumn day={d} compact />
                </div>
              ))}
            </div>
          </>
        )}

        {view === "mes" && (
          <div className="grid grid-cols-7">
            {["S", "T", "Q", "Q", "S", "S", "D"].map((l, i) => <p key={i} className="py-2 text-center text-[11px] font-semibold text-muted-foreground">{l}</p>)}
            {monthDays.map((d) => {
              const list = (byDate[key(d)] || []).filter((a) => a.appointment_type !== "blocked");
              const conflict = list.some(isConflict);
              return (
                <button
                  key={key(d)}
                  onClick={() => { onCursor(d); onView("dia"); }}
                  className={cn("flex min-h-14 flex-col items-center gap-1 border-t border-border p-1 text-xs", !isSameMonth(d, cursor) && "text-muted-foreground/50")}
                >
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-full font-mono", isToday(d) && "bg-primary text-primary-foreground")}>{format(d, "d")}</span>
                  {list.length > 0 && <span className={cn("rounded px-1 text-[10px] font-semibold", conflict ? "bg-destructive/10 text-destructive" : "bg-muted")}>{list.length}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const parseDay = (s: string) => parse(s, "yyyy-MM-dd", new Date());
export default AgendaCalendar;
