import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const BASE = "https://salbcare.com/kite";
const SHORTCUTS = ["Vila Kalango", "Rancho do Peixe", "Casa Zulu", "Pousada Guajiru", "Kite Beach Hotel"];

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface QrPartner {
  id: string;
  pousada_name: string;
  slug: string;
  full_url: string;
  scan_count: number;
  created_at: string;
}

const QrPreview = ({ url, size = 240 }: { url: string; size?: number }) => {
  const [dataUrl, setDataUrl] = useState<string>("");
  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#0d2818", light: "#ffffff" },
    }).then(setDataUrl).catch(() => setDataUrl(""));
  }, [url, size]);
  if (!dataUrl) return <div style={{ width: size, height: size }} className="bg-white/5 rounded" />;
  return <img src={dataUrl} alt="QR Code" width={size} height={size} className="rounded bg-white" />;
};

const AdminQrGenerator = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [latest, setLatest] = useState<QrPartner | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const slug = useMemo(() => slugify(name), [name]);
  const previewUrl = slug ? `${BASE}?ref=${slug}` : "";

  const { data: history = [] } = useQuery({
    queryKey: ["qr_partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qr_partners" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as QrPartner[];
    },
  });

  async function ensureUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let n = 2;
    // Loop until no row matches
    while (true) {
      const { data } = await supabase
        .from("qr_partners" as any)
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      if (!data) return candidate;
      candidate = `${base}-${n++}`;
      if (n > 50) return `${base}-${Date.now()}`;
    }
  }

  const handleGenerate = async () => {
    if (!name.trim()) return toast.error("Informe o nome da pousada");
    if (!user) return toast.error("Sessão expirada");
    setSubmitting(true);
    try {
      const base = slugify(name);
      const finalSlug = await ensureUniqueSlug(base);
      const full_url = `${BASE}?ref=${finalSlug}`;
      const { data, error } = await supabase
        .from("qr_partners" as any)
        .insert({ pousada_name: name.trim(), slug: finalSlug, full_url, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      setLatest(data as unknown as QrPartner);
      qc.invalidateQueries({ queryKey: ["qr_partners"] });
      toast.success("QR code gerado");
    } catch (e: any) {
      toast.error(e.message || "Falha ao gerar");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPng = async (url: string, filename: string) => {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 1024,
      margin: 4,
      errorCorrectionLevel: "H",
      color: { dark: "#0d2818", light: "#ffffff" },
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${filename}.png`;
    a.click();
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("URL copiada");
  };

  const deleteRow = async (id: string) => {
    if (!confirm("Excluir este QR code?")) return;
    const { error } = await supabase.from("qr_partners" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["qr_partners"] });
    toast.success("Removido");
  };

  return (
    <div className="space-y-8 text-white">
      <div>
        <span className="inline-block px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-bold tracking-widest">
          ADMIN TOOL
        </span>
        <h1 className="mt-3 text-3xl font-bold">Gerador de QR Code para Pousadas</h1>
        <p className="mt-2 text-white/60 max-w-2xl">
          Crie QR codes rastreáveis para cada pousada parceira. Cada código aponta para salbcare.com/kite com um identificador único.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
        <div>
          <p className="text-xs text-white/50 mb-2">Atalhos para pousadas conhecidas</p>
          <div className="flex flex-wrap gap-2">
            {SHORTCUTS.map((s) => (
              <button
                key={s}
                onClick={() => setName(s)}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/80 border border-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Nome da pousada</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pousada do Vento"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">URL base</label>
          <div className="px-3 py-2.5 rounded-md bg-black/30 border border-white/10 font-mono text-xs text-white/70 break-all">
            {previewUrl || `${BASE}?ref=`}
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={submitting || !name.trim()}>
          {submitting ? "Gerando..." : "Gerar QR Code →"}
        </Button>
      </div>

      {latest && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 grid md:grid-cols-2 gap-6">
          <div className="flex items-center justify-center bg-white rounded-xl p-4">
            <QrPreview url={latest.full_url} size={320} />
          </div>
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <div><span className="text-white/40">Pousada:</span> <span className="font-medium">{latest.pousada_name}</span></div>
              <div className="break-all"><span className="text-white/40">URL:</span> <span className="font-mono text-xs">{latest.full_url}</span></div>
              <div><span className="text-white/40">Slug:</span> <span className="font-mono text-xs">{latest.slug}</span></div>
              <div><span className="text-white/40">Criado em:</span> {new Date(latest.created_at).toLocaleString("pt-BR")}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => downloadPng(latest.full_url, latest.slug)} size="sm">📥 Download PNG</Button>
              <Button onClick={() => copyUrl(latest.full_url)} size="sm" variant="outline">📋 Copy URL</Button>
              <Button asChild size="sm" variant="outline">
                <Link to={`/admin/qr-generator/print/${latest.id}`} target="_blank">🖨️ Print Card</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="text-lg font-semibold mb-4">Histórico</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Pousada</TableHead>
                <TableHead className="text-white/50">URL</TableHead>
                <TableHead className="text-white/50">Scans</TableHead>
                <TableHead className="text-white/50">Criado</TableHead>
                <TableHead className="text-white/50 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 && (
                <TableRow className="border-white/10"><TableCell colSpan={5} className="text-center text-white/40 py-8">Nenhum QR gerado ainda</TableCell></TableRow>
              )}
              {history.map((row) => (
                <TableRow key={row.id} className="border-white/10">
                  <TableCell className="font-medium text-white">{row.pousada_name}</TableCell>
                  <TableCell className="font-mono text-xs text-white/60 max-w-[280px] truncate">{row.full_url}</TableCell>
                  <TableCell className="text-white/80">{row.scan_count}</TableCell>
                  <TableCell className="text-white/60 text-xs">{new Date(row.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => setLatest(row)} className="text-xs text-blue-400 hover:underline">Ver</button>
                    <button onClick={() => downloadPng(row.full_url, row.slug)} className="text-xs text-blue-400 hover:underline">PNG</button>
                    <button onClick={() => copyUrl(row.full_url)} className="text-xs text-blue-400 hover:underline">Copiar</button>
                    <Link to={`/admin/qr-generator/print/${row.id}`} target="_blank" className="text-xs text-blue-400 hover:underline">Print</Link>
                    <button onClick={() => deleteRow(row.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

const AdminQrGeneratorPage = () => (
  <AdminLayout>
    <AdminQrGenerator />
  </AdminLayout>
);

export default AdminQrGeneratorPage;
