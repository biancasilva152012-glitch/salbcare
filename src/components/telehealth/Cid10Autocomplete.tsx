import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

// Common CID-10 codes used in primary care / general practice
const CID10_DATABASE: { code: string; description: string }[] = [
  { code: "A09", description: "Diarreia e gastroenterite infecciosa" },
  { code: "A15", description: "Tuberculose respiratória" },
  { code: "A90", description: "Dengue" },
  { code: "A91", description: "Dengue hemorrágica" },
  { code: "B15", description: "Hepatite aguda A" },
  { code: "B24", description: "Doença pelo HIV" },
  { code: "B34.9", description: "Infecção viral não especificada" },
  { code: "B97.2", description: "Coronavírus como causa de doenças" },
  { code: "D50", description: "Anemia por deficiência de ferro" },
  { code: "D64.9", description: "Anemia não especificada" },
  { code: "E03", description: "Hipotireoidismo" },
  { code: "E05", description: "Tireotoxicose / Hipertireoidismo" },
  { code: "E10", description: "Diabetes mellitus tipo 1" },
  { code: "E11", description: "Diabetes mellitus tipo 2" },
  { code: "E14", description: "Diabetes mellitus não especificado" },
  { code: "E66", description: "Obesidade" },
  { code: "E78", description: "Distúrbios do metabolismo de lipoproteínas (dislipidemia)" },
  { code: "E78.0", description: "Hipercolesterolemia pura" },
  { code: "E78.5", description: "Hiperlipidemia não especificada" },
  { code: "F10", description: "Transtornos mentais por uso de álcool" },
  { code: "F17", description: "Transtornos mentais por uso de tabaco" },
  { code: "F20", description: "Esquizofrenia" },
  { code: "F31", description: "Transtorno afetivo bipolar" },
  { code: "F32", description: "Episódio depressivo" },
  { code: "F33", description: "Transtorno depressivo recorrente" },
  { code: "F40", description: "Transtornos fóbico-ansiosos" },
  { code: "F41", description: "Outros transtornos ansiosos" },
  { code: "F41.0", description: "Transtorno de pânico" },
  { code: "F41.1", description: "Ansiedade generalizada" },
  { code: "F41.2", description: "Transtorno misto ansioso e depressivo" },
  { code: "F43.1", description: "Transtorno de estresse pós-traumático" },
  { code: "F90", description: "Transtornos hipercinéticos (TDAH)" },
  { code: "G40", description: "Epilepsia" },
  { code: "G43", description: "Enxaqueca" },
  { code: "G43.0", description: "Enxaqueca sem aura" },
  { code: "G43.1", description: "Enxaqueca com aura" },
  { code: "G44.2", description: "Cefaleia tensional" },
  { code: "G47.0", description: "Insônia" },
  { code: "G54", description: "Transtornos das raízes e dos plexos nervosos" },
  { code: "H10", description: "Conjuntivite" },
  { code: "H65", description: "Otite média não supurativa" },
  { code: "H66", description: "Otite média supurativa" },
  { code: "I10", description: "Hipertensão essencial (primária)" },
  { code: "I11", description: "Doença cardíaca hipertensiva" },
  { code: "I20", description: "Angina pectoris" },
  { code: "I21", description: "Infarto agudo do miocárdio" },
  { code: "I25", description: "Doença isquêmica crônica do coração" },
  { code: "I48", description: "Fibrilação e flutter atrial" },
  { code: "I50", description: "Insuficiência cardíaca" },
  { code: "I63", description: "Infarto cerebral (AVC isquêmico)" },
  { code: "I64", description: "AVC não especificado" },
  { code: "I83", description: "Varizes dos membros inferiores" },
  { code: "J00", description: "Nasofaringite aguda (resfriado comum)" },
  { code: "J01", description: "Sinusite aguda" },
  { code: "J02", description: "Faringite aguda" },
  { code: "J03", description: "Amigdalite aguda" },
  { code: "J06", description: "Infecções agudas das VAS" },
  { code: "J06.9", description: "IVAS não especificada" },
  { code: "J10", description: "Influenza (gripe)" },
  { code: "J11", description: "Influenza vírus não identificado" },
  { code: "J15", description: "Pneumonia bacteriana" },
  { code: "J18", description: "Pneumonia por microrganismo não especificado" },
  { code: "J20", description: "Bronquite aguda" },
  { code: "J30", description: "Rinite alérgica" },
  { code: "J31", description: "Rinite crônica, nasofaringite e faringite" },
  { code: "J45", description: "Asma" },
  { code: "J45.0", description: "Asma predominantemente alérgica" },
  { code: "K21", description: "Doença do refluxo gastroesofágico (DRGE)" },
  { code: "K25", description: "Úlcera gástrica" },
  { code: "K29", description: "Gastrite e duodenite" },
  { code: "K30", description: "Dispepsia funcional" },
  { code: "K35", description: "Apendicite aguda" },
  { code: "K40", description: "Hérnia inguinal" },
  { code: "K58", description: "Síndrome do intestino irritável" },
  { code: "K76.0", description: "Esteatose hepática" },
  { code: "K80", description: "Colelitíase (cálculos biliares)" },
  { code: "L20", description: "Dermatite atópica" },
  { code: "L30", description: "Outras dermatites" },
  { code: "L40", description: "Psoríase" },
  { code: "L50", description: "Urticária" },
  { code: "M15", description: "Poliartrose" },
  { code: "M17", description: "Gonartrose (artrose do joelho)" },
  { code: "M19", description: "Outras artroses" },
  { code: "M25.5", description: "Dor articular" },
  { code: "M47", description: "Espondilose" },
  { code: "M51", description: "Transtornos de discos intervertebrais" },
  { code: "M54", description: "Dorsalgia" },
  { code: "M54.2", description: "Cervicalgia" },
  { code: "M54.4", description: "Lumbago com ciática" },
  { code: "M54.5", description: "Dor lombar baixa (lombalgia)" },
  { code: "M65", description: "Sinovite e tenossinovite" },
  { code: "M75", description: "Lesões do ombro" },
  { code: "M75.1", description: "Síndrome do manguito rotador" },
  { code: "M77.1", description: "Epicondilite lateral (cotovelo de tenista)" },
  { code: "M79.1", description: "Mialgia" },
  { code: "M79.3", description: "Paniculite não especificada" },
  { code: "N10", description: "Nefrite túbulo-intersticial aguda (pielonefrite)" },
  { code: "N20", description: "Cálculo do rim e do ureter" },
  { code: "N30", description: "Cistite" },
  { code: "N39.0", description: "Infecção do trato urinário (ITU)" },
  { code: "N40", description: "Hiperplasia benigna da próstata" },
  { code: "N76", description: "Outras afecções inflamatórias da vagina e vulva" },
  { code: "N92", description: "Menstruação excessiva, frequente e irregular" },
  { code: "O80", description: "Parto único espontâneo" },
  { code: "R05", description: "Tosse" },
  { code: "R10", description: "Dor abdominal e pélvica" },
  { code: "R10.4", description: "Dor abdominal não especificada" },
  { code: "R11", description: "Náusea e vômitos" },
  { code: "R42", description: "Tontura e vertigem" },
  { code: "R50", description: "Febre de origem desconhecida" },
  { code: "R51", description: "Cefaleia" },
  { code: "R53", description: "Mal-estar e fadiga" },
  { code: "S62", description: "Fratura ao nível do punho e da mão" },
  { code: "S82", description: "Fratura da perna" },
  { code: "S93", description: "Luxação, entorse e distensão do tornozelo" },
  { code: "T78.4", description: "Alergia não especificada" },
  { code: "Z00.0", description: "Exame médico geral (check-up)" },
  { code: "Z34", description: "Supervisão de gravidez normal" },
  { code: "Z76.0", description: "Emissão de receita de repetição" },
];

interface Cid10AutocompleteProps {
  value: string;
  onChange: (code: string) => void;
  onDiagnosisSelect?: (description: string) => void;
}

const Cid10Autocomplete = ({ value, onChange, onDiagnosisSelect }: Cid10AutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<typeof CID10_DATABASE>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (text: string) => {
    setQuery(text);
    onChange(text);

    if (text.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const q = text.toLowerCase();
    const filtered = CID10_DATABASE.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    ).slice(0, 8);

    setResults(filtered);
    setOpen(filtered.length > 0);
  };

  const handleSelect = (item: typeof CID10_DATABASE[0]) => {
    setQuery(item.code);
    onChange(item.code);
    onDiagnosisSelect?.(item.description);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative space-y-1">
      <Label className="text-[11px] text-muted-foreground">CID-10 (busque por código ou descrição)</Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Ex: J06.9 ou gripe, lombalgia..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
          className="bg-accent border-border h-8 text-sm pl-8"
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {results.map((item) => (
            <button
              key={item.code}
              onClick={() => handleSelect(item)}
              className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-accent transition-colors"
            >
              <span className="text-xs font-mono font-semibold text-primary shrink-0 mt-0.5">
                {item.code}
              </span>
              <span className="text-xs text-foreground">{item.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cid10Autocomplete;
