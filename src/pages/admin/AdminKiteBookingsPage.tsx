import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Search, FileDown, FileText, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Booking = {
  id: string;
  type: string;
  procedure: string;
  patient_name: string;
  email: string;
  preferred_date: string | null;
  time_preference: string | null;
  status: string;
  amount_paid: number;
  remaining_balance: number;
  notes: string | null;
  created_at: string;
};

const STATUSES: { value: string; label: string; tone: string }[] = [
  { value: "all", label: "Todos", tone: "bg-white/10 text-white/80" },
  { value: "pending", label: "Pendente", tone: "bg-amber-500/15 text-amber-300" },
  { value: "pending_whatsapp", label: "Aguardando WhatsApp", tone: "bg-blue-500/15 text-blue-300" },
  { value: "confirmado", label: "Confirmado", tone: "bg-emerald-500/15 text-emerald-300" },
  { value: "paid", label: "Pago", tone: "bg-emerald-500/15 text-emerald-300" },
  { value: "cancelled", label: "Cancelado", tone: "bg-red-500/15 text-red-300" },
  { value: "erro", label: "Erro", tone: "bg-red-500/15 text-red-300" },
];

const NEXT_STATUS_OPTIONS = ["pending_whatsapp", "confirmado", "cancelled", "erro"];

function statusBadge(s: string) {
  const found = STATUSES.find((x) => x.value === s);
  const tone = found?.tone || "bg-white/10 text-white/70";
  const label = found?.label || s;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${tone}`}>
      {label}
    </span>
  );
}

type BookingEventAgg = {
  retry_count: number;
  last_event_type: string | null;
  last_event_at: string | null;
  events_summary: string;
};

async function fetchEventAggregates(ids: string[]): Promise<Record<string, BookingEventAgg>> {
  const out: Record<string, BookingEventAgg> = {};
  if (ids.length === 0) return out;
  const { data } = await supabase
    .from("kite_booking_events")
    .select("booking_id,event_type,created_at")
    .in("booking_id", ids)
    .order("created_at", { ascending: true });
  for (const row of (data || []) as any[]) {
    const a = out[row.booking_id] || { retry_count: 0, last_event_type: null, last_event_at: null, events_summary: "" };
    if (row.event_type === "retry_attempt" || row.event_type === "manual_resend") a.retry_count += 1;
    a.last_event_type = row.event_type;
    a.last_event_at = row.created_at;
    a.events_summary = (a.events_summary ? a.events_summary + " → " : "") + row.event_type;
    out[row.booking_id] = a;
  }
  return out;
}

async function exportCsv(rows: Booking[]) {
  const agg = await fetchEventAggregates(rows.map((b) => b.id));
  const headers = [
    "Created", "Patient", "Email", "Service", "Type", "Date", "Time",
    "Status", "Paid", "Remaining", "Notes",
    "Retries", "LastEvent", "LastEventAt", "Timeline",
  ];
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const b of rows) {
    const a = agg[b.id] || { retry_count: 0, last_event_type: "", last_event_at: "", events_summary: "" };
    lines.push([
      new Date(b.created_at).toISOString(),
      b.patient_name, b.email, b.procedure, b.type,
      b.preferred_date || "", b.time_preference || "",
      b.status, b.amount_paid, b.remaining_balance, b.notes || "",
      a.retry_count, a.last_event_type || "", a.last_event_at || "", a.events_summary,
    ].map(escape).join(","));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kite-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(rows: Booking[]) {
  const agg = await fetchEventAggregates(rows.map((b) => b.id));
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("SalbCare Kite — Reservas", 14, 14);
  doc.setFontSize(9);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} · ${rows.length} registros`, 14, 20);
  autoTable(doc, {
    startY: 26,
    head: [["Criada", "Paciente", "Serviço", "Data", "Hora", "Status", "Retries", "Último evento", "Timeline"]],
    body: rows.map((b) => {
      const a = agg[b.id] || { retry_count: 0, last_event_type: "—", events_summary: "—" };
      return [
        new Date(b.created_at).toLocaleString("pt-BR"),
        b.patient_name,
        `${b.procedure} (${b.type})`,
        b.preferred_date || "—",
        b.time_preference || "—",
        b.status,
        String(a.retry_count),
        a.last_event_type || "—",
        a.events_summary || "—",
      ];
    }),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [13, 27, 42] },
  });
  doc.save(`kite-bookings-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function AdminKiteBookingsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Quick platform snapshot for admin: signups + paying users + kite total.
  const { data: snapshot } = useQuery({
    queryKey: ["admin-kite-snapshot"],
    queryFn: async () => {
      const [profilesTotal, profilesPaying, kiteTotal] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("user_type", "professional"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("user_type", "professional")
          .in("payment_status", ["active", "trialing", "paid"]),
        supabase.from("kite_bookings").select("id", { count: "exact", head: true }),
      ]);
      return {
        signups: profilesTotal.count ?? 0,
        paying: profilesPaying.count ?? 0,
        kite: kiteTotal.count ?? 0,
      };
    },
    staleTime: 60_000,
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-kite-bookings"],
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from("kite_bookings")
        .select("id,type,procedure,patient_name,email,preferred_date,time_preference,status,amount_paid,remaining_balance,notes,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as Booking[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("kite_bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Status atualizado" });
      qc.invalidateQueries({ queryKey: ["admin-kite-bookings"] });
    },
    onError: (err: any) => {
      toast({ title: "Falha ao atualizar", description: err.message, variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    const list = data || [];
    const q = search.trim().toLowerCase();
    const fromTs = fromDate ? new Date(fromDate + "T00:00:00").getTime() : null;
    const toTs = toDate ? new Date(toDate + "T23:59:59").getTime() : null;
    return list.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      const t = new Date(b.created_at).getTime();
      if (fromTs && t < fromTs) return false;
      if (toTs && t > toTs) return false;
      if (!q) return true;
      return (
        b.patient_name?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        (b.notes || "").toLowerCase().includes(q)
      );
    });
  }, [data, search, statusFilter, fromDate, toDate]);

  const counts = useMemo(() => {
    const list = data || [];
    const map: Record<string, number> = { all: list.length };
    for (const b of list) map[b.status] = (map[b.status] || 0) + 1;
    return map;
  }, [data]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Reservas Kite</h1>
            <p className="text-xs text-white/40 mt-0.5">
              Auditoria de reservas vindas do fluxo WhatsApp e Stripe.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv(filtered)}
              disabled={isLoading || filtered.length === 0}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPdf(filtered)}
              disabled={isLoading || filtered.length === 0}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Platform snapshot */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Inscritos (profissionais)", value: snapshot?.signups ?? "—" },
            { label: "Pagantes / Trial", value: snapshot?.paying ?? "—" },
            { label: "Reservas Kite (total)", value: snapshot?.kite ?? "—" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-white/[0.06] bg-[hsl(220,20%,10%)] p-4">
              <p className="text-[10px] uppercase tracking-wide text-white/40">{m.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-white/[0.06] bg-[hsl(220,20%,10%)] p-4 space-y-3">
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, email ou observação…"
                className="pl-9 bg-[hsl(220,20%,8%)] border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-[hsl(220,20%,8%)] border-white/10 text-white w-[150px]"
              aria-label="Data inicial"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-[hsl(220,20%,8%)] border-white/10 text-white w-[150px]"
              aria-label="Data final"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition ${
                  statusFilter === s.value
                    ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
                    : "border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
                }`}
              >
                {s.label}
                <span className="ml-1.5 text-white/40">{counts[s.value] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/[0.06] bg-[hsl(220,20%,10%)] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-white/40 text-sm">
              Nenhuma reserva encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-white/[0.02] text-white/40 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Quando</th>
                    <th className="text-left px-4 py-3 font-medium">Paciente</th>
                    <th className="text-left px-4 py-3 font-medium">Serviço</th>
                    <th className="text-left px-4 py-3 font-medium">Data preferida</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Ação</th>
                    <th className="text-left px-4 py-3 font-medium">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white/60 whitespace-nowrap">
                        {new Date(b.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{b.patient_name}</div>
                        <div className="text-white/40 text-[10px]">{b.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white/80">{b.procedure}</div>
                        <div className="text-white/40 text-[10px]">{b.type}</div>
                      </td>
                      <td className="px-4 py-3 text-white/60 whitespace-nowrap">
                        {b.preferred_date || "—"}{" "}
                        <span className="text-white/30">{b.time_preference || ""}</span>
                      </td>
                      <td className="px-4 py-3">{statusBadge(b.status)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={b.status}
                          disabled={updateStatus.isPending}
                          onChange={(e) =>
                            updateStatus.mutate({ id: b.id, status: e.target.value })
                          }
                          className="bg-[hsl(220,20%,8%)] border border-white/10 rounded-md px-2 py-1 text-[11px] text-white/80"
                        >
                          {[b.status, ...NEXT_STATUS_OPTIONS.filter((s) => s !== b.status)].map(
                            (s) => (
                              <option key={s} value={s}>
                                {STATUSES.find((x) => x.value === s)?.label || s}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/kite-bookings/${b.id}`}
                          className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 text-[11px] font-medium"
                        >
                          Ver <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
