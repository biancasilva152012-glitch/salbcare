import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface Patient {
  id: string;
  name: string;
  phone: string | null;
}

interface PatientSearchInputProps {
  value: string;
  patientId: string;
  onChange: (name: string, patientId: string) => void;
}

const PatientSearchInput = ({ value, patientId, onChange }: PatientSearchInputProps) => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLinked, setIsLinked] = useState(!!patientId);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-list", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("patients")
        .select("id, name, phone")
        .eq("user_id", user!.id)
        .order("name");
      return (data || []) as Patient[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    setInputValue(value);
    setIsLinked(!!patientId);
  }, [value, patientId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setShowDropdown(val.length > 0);
    setIsLinked(false);
    onChange(val, "");
  };

  const handleSelect = (patient: Patient) => {
    setInputValue(patient.name);
    setShowDropdown(false);
    setIsLinked(true);
    onChange(patient.name, patient.id);
  };

  const handleClear = () => {
    setInputValue("");
    setIsLinked(false);
    setShowDropdown(false);
    onChange("", "");
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar ou digitar nome..."
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => inputValue.length > 0 && !isLinked && setShowDropdown(true)}
          className={`bg-accent border-border pl-9 pr-8 ${isLinked ? "border-primary/50" : ""}`}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isLinked && (
        <p className="text-[10px] text-primary mt-0.5">✓ Paciente vinculado</p>
      )}

      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-40 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-primary">
                {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{p.name}</p>
                {p.phone && <p className="text-[10px] text-muted-foreground">{p.phone}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && inputValue.length > 0 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-3 shadow-lg">
          <p className="text-xs text-muted-foreground text-center">
            Nenhum paciente encontrado. O nome será usado sem vínculo.
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientSearchInput;
