import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageContainer from "@/components/PageContainer";

interface Patient {
  id: number;
  name: string;
  phone: string;
  birth_date: string;
  notes: string;
  medical_history: string;
}

const initialPatients: Patient[] = [
  { id: 1, name: "Maria Santos", phone: "(11) 98765-4321", birth_date: "1985-03-15", notes: "Alérgica a dipirona", medical_history: "Hipertensão controlada" },
  { id: 2, name: "João Oliveira", phone: "(11) 91234-5678", birth_date: "1990-07-22", notes: "", medical_history: "Sem comorbidades" },
  { id: 3, name: "Ana Costa", phone: "(21) 99876-5432", birth_date: "1978-11-30", notes: "Gestante 28 semanas", medical_history: "Diabetes gestacional" },
  { id: 4, name: "Pedro Lima", phone: "(11) 97654-3210", birth_date: "1995-01-10", notes: "", medical_history: "Ansiedade, uso de ISRS" },
  { id: 5, name: "Carla Souza", phone: "(31) 98888-7777", birth_date: "2000-05-20", notes: "Primeira consulta em 13/03", medical_history: "" },
];

const Patients = () => {
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [open, setOpen] = useState(false);
  const [newP, setNewP] = useState({ name: "", phone: "", birth_date: "", notes: "", medical_history: "" });

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    setPatients([...patients, { ...newP, id: Date.now() }]);
    setNewP({ name: "", phone: "", birth_date: "", notes: "", medical_history: "" });
    setOpen(false);
  };

  return (
    <PageContainer>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary gap-1"><Plus className="h-4 w-4" /> Novo</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Novo Paciente</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5"><Label>Nome</Label><Input placeholder="Nome completo" value={newP.name} onChange={(e) => setNewP({ ...newP, name: e.target.value })} className="bg-accent border-border" /></div>
                <div className="space-y-1.5"><Label>Telefone</Label><Input placeholder="(11) 99999-9999" value={newP.phone} onChange={(e) => setNewP({ ...newP, phone: e.target.value })} className="bg-accent border-border" /></div>
                <div className="space-y-1.5"><Label>Data de nascimento</Label><Input type="date" value={newP.birth_date} onChange={(e) => setNewP({ ...newP, birth_date: e.target.value })} className="bg-accent border-border" /></div>
                <div className="space-y-1.5"><Label>Observações</Label><Textarea placeholder="Notas..." value={newP.notes} onChange={(e) => setNewP({ ...newP, notes: e.target.value })} className="bg-accent border-border" /></div>
                <div className="space-y-1.5"><Label>Histórico médico</Label><Textarea placeholder="Histórico..." value={newP.medical_history} onChange={(e) => setNewP({ ...newP, medical_history: e.target.value })} className="bg-accent border-border" /></div>
                <Button onClick={handleAdd} className="w-full gradient-primary font-semibold">Cadastrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-accent border-border pl-9" />
        </div>

        {/* Patient Detail */}
        {selected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">Fechar</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Telefone:</span> {selected.phone}</div>
              <div><span className="text-muted-foreground">Nascimento:</span> {new Date(selected.birth_date + "T12:00:00").toLocaleDateString("pt-BR")}</div>
            </div>
            {selected.notes && <div className="text-sm"><span className="text-muted-foreground">Notas:</span> {selected.notes}</div>}
            {selected.medical_history && (
              <div className="text-sm rounded-lg bg-accent p-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Histórico Médico</span>
                <p className="mt-1">{selected.medical_history}</p>
              </div>
            )}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className="glass-card flex w-full items-center justify-between p-3 text-left transition-all hover:border-primary/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                  {p.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.phone}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default Patients;
