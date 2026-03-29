import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Stethoscope, FileSignature, X } from "lucide-react";
import { maskPhone, maskCpf } from "@/utils/masks";
import { isValidCpf } from "@/utils/cpfValidator";

const professionalTypes = [
  { value: "medico", label: "Médico(a)", prefix: "CRM" },
  { value: "dentista", label: "Cirurgião(ã)-Dentista", prefix: "CRO" },
  { value: "enfermeiro", label: "Enfermeiro(a) / Técnico(a) de Enfermagem", prefix: "COREN" },
  { value: "farmaceutico", label: "Farmacêutico(a)", prefix: "CRF" },
  { value: "psicologo", label: "Psicólogo(a)", prefix: "CRP" },
  { value: "fisioterapeuta", label: "Fisioterapeuta / Terapeuta Ocupacional", prefix: "CREFITO" },
  { value: "nutricionista", label: "Nutricionista", prefix: "CRN" },
  { value: "assistente_social", label: "Assistente Social", prefix: "CRAS" },
  { value: "biomedico", label: "Biomédico(a)", prefix: "CRBM" },
  { value: "fonoaudiologo", label: "Fonoaudiólogo(a)", prefix: "CRFono" },
  { value: "outro", label: "Outro", prefix: "Conselho" },
];

const brStates = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    phone: "",
    cpf: "",
    professional_type: "",
    council_number: "",
    council_state: "",
    meet_link: "",
  });

  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const councilPrefix = professionalTypes.find(p => p.value === form.professional_type)?.prefix || "Conselho";

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Envie uma imagem (PNG, JPG)."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Máximo 2MB."); return; }
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
  };

  const removeSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
    if (signatureInputRef.current) signatureInputRef.current.value = "";
  };

  const canSubmit = () => {
    return !!form.professional_type && !!form.council_number.trim() && !!form.council_state
      && !!form.meet_link.trim() && !!signatureFile && !!form.phone && !!form.cpf && isValidCpf(form.cpf);
  };

  const handleSubmit = async () => {
    if (!user || !canSubmit()) return;
    setLoading(true);

    try {
      // Upload signature
      let signatureUrl: string | null = null;
      if (signatureFile) {
        const ext = signatureFile.name.split(".").pop() || "png";
        const filePath = `${user.id}/signature.${ext}`;
        console.log("[CompleteProfile] Uploading signature:", filePath);
        const { error: uploadErr } = await supabase.storage
          .from("professional-assets")
          .upload(filePath, signatureFile, { upsert: true });
        if (uploadErr) {
          console.error("[CompleteProfile] Upload error:", uploadErr);
        } else {
          const { data: urlData } = supabase.storage.from("professional-assets").getPublicUrl(filePath);
          signatureUrl = urlData.publicUrl;
          console.log("[CompleteProfile] Signature URL:", signatureUrl);
        }
      }

      // Update profile with professional data
      console.log("[CompleteProfile] Updating profile...");
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          phone: form.phone,
          professional_type: form.professional_type,
          council_number: form.council_number,
          council_state: form.council_state,
          meet_link: form.meet_link.trim(),
          user_type: "professional",
          verification_status: "approved",
        } as any)
        .eq("user_id", user.id);

      if (profileErr) console.error("[CompleteProfile] Profile update error:", profileErr);

      // Insert into professionals table
      console.log("[CompleteProfile] Inserting professional record...");
      const { error: profErr } = await supabase
        .from("professionals")
        .insert({
          user_id: user.id,
          name: user.user_metadata?.name || user.email || "",
          email: user.email || "",
          phone: form.phone,
          specialty: form.professional_type,
          crm: `${councilPrefix} ${form.council_number}`,
          status: "active",
          signature_url: signatureUrl,
          meet_link: form.meet_link.trim(),
        } as any);

      if (profErr) console.error("[CompleteProfile] Professional insert error:", profErr);

      toast.success("Perfil profissional completado!");
      navigate("/onboarding");
    } catch (err) {
      console.error("[CompleteProfile] Error:", err);
      toast.error("Erro ao salvar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm space-y-6"
      >
        <motion.div className="text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <motion.div className="mx-auto mb-2 h-16 w-16 relative">
            <img src="/pwa-icon-512.png" alt="SALBCARE" className="h-full w-full object-contain" />
          </motion.div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Complete seu Cadastro</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Precisamos de alguns dados profissionais para ativar sua conta.</p>
        </motion.div>

        <div className="glass-card p-5 space-y-3">
          <div className="space-y-1.5">
            <Label>WhatsApp *</Label>
            <Input placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} className="bg-background/50 border-border/60" />
          </div>
          <div className="space-y-1.5">
            <Label>CPF *</Label>
            <Input placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })} className="bg-background/50 border-border/60" />
            {form.cpf && form.cpf.replace(/\D/g, "").length === 11 && !isValidCpf(form.cpf) && (
              <p className="text-[10px] text-destructive">CPF inválido</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Conselho profissional *</Label>
            <Select onValueChange={(v) => setForm({ ...form, professional_type: v })} value={form.professional_type}>
              <SelectTrigger className="bg-background/50 border-border/60">
                <SelectValue placeholder="Selecione seu conselho" />
              </SelectTrigger>
              <SelectContent>
                {professionalTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.prefix} — {t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nº {councilPrefix} *</Label>
            <Input placeholder={`Ex: ${councilPrefix}/12345`} value={form.council_number} onChange={(e) => setForm({ ...form, council_number: e.target.value })} className="bg-background/50 border-border/60" />
          </div>
          <div className="space-y-1.5">
            <Label>UF do registro *</Label>
            <Select onValueChange={(v) => setForm({ ...form, council_state: v })} value={form.council_state}>
              <SelectTrigger className="bg-background/50 border-border/60">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {brStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Link do Google Meet *</Label>
            <Input placeholder="https://meet.google.com/xxx-yyyy-zzz" value={form.meet_link} onChange={(e) => setForm({ ...form, meet_link: e.target.value })} className="bg-background/50 border-border/60" />
          </div>
          <div className="space-y-1.5">
            <Label>Assinatura digital *</Label>
            {signaturePreview ? (
              <div className="relative border border-border/60 rounded-md p-2 bg-background/50">
                <img src={signaturePreview} alt="Assinatura" className="max-h-20 mx-auto object-contain" />
                <button type="button" onClick={removeSignature} className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => signatureInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 h-20 rounded-md border-2 border-dashed border-border/60 bg-background/30 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                <FileSignature className="h-5 w-5" />
                <span className="text-xs">Enviar imagem da assinatura</span>
              </button>
            )}
            <input ref={signatureInputRef} type="file" accept="image/*" onChange={handleSignatureChange} className="hidden" />
            <p className="text-[10px] text-muted-foreground">PNG ou JPG, máx 2MB</p>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full h-11 font-semibold"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
          disabled={!canSubmit() || loading}
        >
          {loading ? (
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
              Salvando...
            </motion.span>
          ) : (
            "Completar cadastro"
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;
