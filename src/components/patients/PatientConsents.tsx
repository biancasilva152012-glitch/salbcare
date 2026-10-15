import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const buildTerm = (patient: string, cpf: string, procedure: string, pro: string, council: string) =>
  `Eu, ${patient || "_____"}${cpf ? `, CPF ${cpf}` : ""}, autorizo ${pro || "o(a) profissional responsável"}${council ? ` (${council})` : ""} a realizar o procedimento: ${procedure || "_____"}.

1. Declaro que recebi explicações claras sobre o procedimento, seus objetivos, benefícios, riscos e alternativas.
2. Tive a oportunidade de fazer perguntas e todas foram respondidas de forma satisfatória.
3. Estou ciente de que todo procedimento pode apresentar complicações, mesmo quando realizado com técnica adequada.
4. Comprometo-me a seguir as orientações pré e pós-procedimento e a informar meu histórico de saúde com veracidade.
5. Autorizo, se necessário durante o atendimento, condutas adicionais para preservar minha saúde.
6. Autorizo o registro de imagens para fins de prontuário, mantido o sigilo profissional.
7. Sei que posso revogar este consentimento a qualquer momento antes do procedimento.
8. Meus dados são tratados conforme a LGPD (Lei 13.709/2018), apenas para fins de atendimento.
9. Declaro que li e compreendi este termo e o assino de forma livre e esclarecida.`;

const SignaturePad = ({ onChange }: { onChange: (d: string | null) => void }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current!;
    c.width = c.offsetWidth * 2;
    c.height = 320;
    const ctx = c.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0A1628";
  }, []);
  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  return (
    <div className="space-y-1">
      <canvas
        ref={ref}
        className="h-40 w-full touch-none rounded-lg border border-border bg-card"
        onPointerDown={(e) => { drawing.current = true; const [x, y] = pos(e); const ctx = ref.current!.getContext("2d")!; ctx.beginPath(); ctx.moveTo(x, y); }}
        onPointerMove={(e) => { if (!drawing.current) return; const [x, y] = pos(e); const ctx = ref.current!.getContext("2d")!; ctx.lineTo(x, y); ctx.stroke(); }}
        onPointerUp={() => { drawing.current = false; onChange(ref.current!.toDataURL("image/png")); }}
        onPointerLeave={() => { if (drawing.current) { drawing.current = false; onChange(ref.current!.toDataURL("image/png")); } }}
      />
      <button type="button" className="h-10 text-xs text-muted-foreground underline" onClick={() => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); onChange(null); }}>
        Limpar assinatura
      </button>
    </div>
  );
};

const exportPdf = (c: any) => {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO", w / 2, 20, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const lines = doc.splitTextToSize(c.content, w - 28);
  let y = 32;
  for (const l of lines) { if (y > 230) { doc.addPage(); y = 20; } doc.text(l, 14, y); y += 5; }
  y += 8;
  doc.addImage(c.signature_data, "PNG", w / 2 - 40, y, 80, 28);
  y += 30; doc.line(w / 2 - 45, y, w / 2 + 45, y);
  doc.text(c.patient_name, w / 2, y + 5, { align: "center" });
  doc.setFontSize(8); doc.setTextColor(120);
  doc.text(`Assinado digitalmente em ${new Date(c.signed_at).toLocaleString("pt-BR")} via SALBCARE. ID ${c.id}`, w / 2, y + 12, { align: "center" });
  doc.save(`termo-${c.patient_name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
};

const PatientConsents = ({ patientId, patientName }: { patientId: string; patientName: string }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cpf, setCpf] = useState("");
  const [procedure, setProcedure] = useState("");
  const [content, setContent] = useState("");
  const [edited, setEdited] = useState(false);
  const [sig, setSig] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["consent-profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("name, council_number, council_state").eq("user_id", user!.id).maybeSingle()).data,
  });
  const { data: list = [] } = useQuery({
    queryKey: ["consents", patientId],
    queryFn: async () => (await supabase.from("patient_consents").select("*").eq("patient_id", patientId).order("signed_at", { ascending: false })).data || [],
  });

  const council = profile?.council_number ? `${profile.council_number}${profile.council_state ? `/${profile.council_state}` : ""}` : "";
  useEffect(() => {
    if (!edited) setContent(buildTerm(patientName, cpf, procedure, profile?.name || "", council));
  }, [patientName, cpf, procedure, profile, council, edited]);

  const save = async () => {
    if (!user) return;
    if (!procedure.trim()) return toast.error("Informe o procedimento.");
    if (!sig) return toast.error("Peça para o paciente assinar.");
    if (!agree) return toast.error("Confirme a leitura do termo.");
    setSaving(true);
    const { error } = await supabase.from("patient_consents").insert({
      user_id: user.id, patient_id: patientId, patient_name: patientName, patient_cpf: cpf || null,
      procedure_name: procedure.trim().slice(0, 200), content: content.slice(0, 10000),
      professional_name: profile?.name || "", council: council || null, signature_data: sig,
    });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar o termo.");
    toast.success("Termo assinado e salvo.");
    setOpen(false); setSig(null); setAgree(false); setProcedure(""); setEdited(false);
    qc.invalidateQueries({ queryKey: ["consents", patientId] });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Termos de consentimento</p>
        <Button size="sm" className="h-10" onClick={() => setOpen(true)}>Novo termo</Button>
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum termo assinado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((c: any) => (
            <li key={c.id} className="flex items-center justify-between gap-2 rounded-md bg-accent p-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.procedure_name}</p>
                <p className="text-xs text-muted-foreground">Assinado em {new Date(c.signed_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <Button size="sm" variant="outline" className="h-10 shrink-0" onClick={() => exportPdf(c)}>PDF</Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto bg-card">
          <DialogHeader><DialogTitle>Termo de consentimento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Procedimento</Label><Input className="h-12" value={procedure} maxLength={200} onChange={(e) => setProcedure(e.target.value)} placeholder="Ex.: Extração do dente 38" /></div>
            <div className="space-y-1"><Label>CPF do paciente (opcional)</Label><Input className="h-12" value={cpf} maxLength={14} onChange={(e) => setCpf(e.target.value)} /></div>
            <div className="space-y-1"><Label>Texto do termo</Label><Textarea rows={10} className="text-xs" value={content} onChange={(e) => { setEdited(true); setContent(e.target.value); }} /></div>
            <div className="space-y-1"><Label>Assinatura do paciente</Label><SignaturePad onChange={setSig} /></div>
            <label className="flex min-h-12 items-center gap-2 text-sm">
              <input type="checkbox" className="h-5 w-5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              O paciente leu e concorda com o termo.
            </label>
            <Button className="h-12 w-full" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar termo assinado"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientConsents;
