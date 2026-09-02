import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProSubscription } from "@/hooks/useProSubscription";
import { CREAM, GOLD, MONO, NAVY, PRO_FONTS_HREF, ProLabel, TEAL, proStyles } from "@/components/pro/brand";
import { ProProfileFields, ProProfileForm, emptyProfile, normalizeLanguages } from "./ProOnboarding";

type TabKey = "perfil" | "agenda" | "pacientes" | "financeiro" | "materiais" | "assinatura";

const TABS: { key: TabKey; label: string }[] = [
  { key: "perfil", label: "Perfil" },
  { key: "agenda", label: "Agenda" },
  { key: "pacientes", label: "Pacientes" },
  { key: "financeiro", label: "Financeiro" },
  { key: "materiais", label: "Materiais" },
  { key: "assinatura", label: "Assinatura" },
];

type Appointment = {
  id: string;
  patient_name: string;
  patient_id: string | null;
  scheduled_at: string;
  service: string | null;
  status: string;
};

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  preferred_language: string | null;
  notes: string | null;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  pro_appointment_id: string | null;
};

const emptyPatient = { name: "", phone: "", email: "", city: "", preferred_language: "", notes: "" };
const emptyTx = { description: "", amount: "", type: "income", date: "", pro_appointment_id: "" };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dashStyles = `
  .pro-dash { display: grid; gap: 28px; grid-template-columns: 220px 1fr; align-items: start; }
  .pro-sidenav { display: grid; gap: 4px; position: sticky; top: 24px; }
  .pro-bottomnav { display: none; }
  .pro-navbtn { text-align: left; border-radius: 10px; padding: 10px 14px; font-size: 13px; font-family: ${MONO}; cursor: pointer; background: transparent; color: ${CREAM}; border: 1px solid transparent; }
  .pro-navbtn[aria-current="page"] { background: rgba(31,31,31,0.04); border-color: rgba(244,238,226,0.2); }
  .pro-row { display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid rgba(31,31,31,0.12); padding-top: 10px; font-size: 13px; }
  .pro-ghostbtn { background: none; border: none; color: rgba(31,31,31,0.56); cursor: pointer; font-size: 12px; font-family: ${MONO}; }
  @media (max-width: 860px) {
    .pro-dash { grid-template-columns: 1fr; }
    .pro-sidenav { display: none; }
    .pro-bottomnav {
      display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
      overflow-x: auto; gap: 4px; padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
      background: ${NAVY}; border-top: 1px solid rgba(31,31,31,0.12);
    }
    .pro-bottomnav .pro-navbtn { white-space: nowrap; }
    .pro-dashpad { padding-bottom: 84px; }
  }
`;

const ProDashboard = () => {
  const { user } = useAuth();
  const { subscription } = useProSubscription();
  const [tab, setTab] = useState<TabKey>("perfil");

  const [form, setForm] = useState<ProProfileForm>(emptyProfile);
  const [published, setPublished] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [newAppt, setNewAppt] = useState({ patient_name: "", patient_id: "", scheduled_at: "", service: "" });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [newPatient, setNewPatient] = useState(emptyPatient);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTx, setNewTx] = useState(emptyTx);

  const [materials, setMaterials] = useState<{ name: string }[]>([]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("local_partners").select("*").eq("owner_user_id", user.id).maybeSingle();
    if (data) {
      setPublished(!!data.is_published);
      setForm({
        name: data.name ?? "",
        profession: data.profession ?? "",
        registration_number: data.registration_number ?? "",
        city: data.city ?? "",
        languages: normalizeLanguages(data.languages),
        description: data.description ?? "",
        description_en: data.description_en ?? "",
        whatsapp: data.whatsapp ?? "",
        instagram: data.instagram ?? "",
        image_url: data.image_url ?? "",
      });
    }
  }, [user]);

  const loadAppointments = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pro_appointments")
      .select("id, patient_name, patient_id, scheduled_at, service, status")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true });
    setAppointments((data as Appointment[]) ?? []);
  }, [user]);

  const loadPatients = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("patients")
      .select("id, name, phone, email, city, preferred_language, notes")
      .eq("user_id", user.id)
      .order("name");
    setPatients((data as Patient[]) ?? []);
  }, [user]);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("financial_transactions")
      .select("id, description, amount, type, date, pro_appointment_id")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(200);
    setTransactions((data as Transaction[]) ?? []);
  }, [user]);

  const loadMaterials = useCallback(async () => {
    const { data } = await supabase.storage.from("pro-materials").list("", { limit: 50 });
    setMaterials((data ?? []).filter((f) => f.name && !f.name.startsWith(".")).map((f) => ({ name: f.name })));
  }, []);

  useEffect(() => {
    loadProfile();
    loadAppointments();
    loadPatients();
    loadTransactions();
    loadMaterials();
  }, [loadProfile, loadAppointments, loadPatients, loadTransactions, loadMaterials]);

  const monthTotals = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let income = 0;
    let expense = 0;
    transactions
      .filter((t) => t.date?.startsWith(prefix))
      .forEach((t) => {
        const value = Number(t.amount) || 0;
        if (t.type === "expense") expense += value;
        else income += value;
      });
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const saveProfile = async (publish: boolean) => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("local_partners").upsert(
      {
        owner_user_id: user.id,
        name: form.name,
        category: "health",
        profession: form.profession,
        registration_number: form.registration_number || null,
        city: form.city,
        location: form.city,
        languages: form.languages,
        description: form.description || null,
        description_en: form.description_en || null,
        whatsapp: form.whatsapp || null,
        instagram: form.instagram || null,
        image_url: form.image_url || null,
        is_published: publish,
        active: true,
      },
      { onConflict: "owner_user_id" },
    );
    setSavingProfile(false);
    if (error) {
      toast.error("Não foi possível salvar.");
      return;
    }
    setPublished(publish);
    toast.success(publish ? "Perfil publicado." : "Perfil salvo e despublicado.");
  };

  const addAppointment = async () => {
    if (!user) return;
    const linked = patients.find((p) => p.id === newAppt.patient_id);
    const name = linked?.name || newAppt.patient_name;
    if (!name || !newAppt.scheduled_at) {
      toast.error("Informe paciente e data.");
      return;
    }
    const { error } = await supabase.from("pro_appointments").insert({
      user_id: user.id,
      patient_name: name,
      patient_id: newAppt.patient_id || null,
      scheduled_at: new Date(newAppt.scheduled_at).toISOString(),
      service: newAppt.service || null,
    });
    if (error) {
      toast.error("Não foi possível salvar o atendimento.");
      return;
    }
    setNewAppt({ patient_name: "", patient_id: "", scheduled_at: "", service: "" });
    loadAppointments();
  };

  const removeAppointment = async (id: string) => {
    await supabase.from("pro_appointments").delete().eq("id", id);
    loadAppointments();
  };

  const addPatient = async () => {
    if (!user) return;
    if (!newPatient.name) {
      toast.error("Informe o nome do paciente.");
      return;
    }
    const { error } = await supabase.from("patients").insert({
      user_id: user.id,
      name: newPatient.name,
      phone: newPatient.phone || null,
      email: newPatient.email || null,
      city: newPatient.city || null,
      preferred_language: newPatient.preferred_language || null,
      notes: newPatient.notes || null,
    });
    if (error) {
      toast.error("Não foi possível salvar o paciente.");
      return;
    }
    setNewPatient(emptyPatient);
    loadPatients();
  };

  const removePatient = async (id: string) => {
    await supabase.from("patients").delete().eq("id", id);
    loadPatients();
  };

  const addTransaction = async () => {
    if (!user) return;
    const value = Number(String(newTx.amount).replace(",", "."));
    if (!newTx.description || !value || !newTx.date) {
      toast.error("Informe descrição, valor e data.");
      return;
    }
    const { error } = await supabase.from("financial_transactions").insert({
      user_id: user.id,
      description: newTx.description,
      amount: value,
      type: newTx.type,
      category: "pro",
      date: newTx.date,
      pro_appointment_id: newTx.pro_appointment_id || null,
    });
    if (error) {
      toast.error("Não foi possível salvar o lançamento.");
      return;
    }
    setNewTx(emptyTx);
    loadTransactions();
  };

  const removeTransaction = async (id: string) => {
    await supabase.from("financial_transactions").delete().eq("id", id);
    loadTransactions();
  };

  const downloadMaterial = async (name: string) => {
    const { data, error } = await supabase.storage.from("pro-materials").createSignedUrl(name, 120);
    if (error || !data?.signedUrl) {
      toast.error("Material indisponível.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("pro-portal");
    if (error || !data?.url) {
      toast.error("Não foi possível abrir a gestão da assinatura.");
      return;
    }
    window.location.href = data.url;
  };

  const navButtons = TABS.map((t) => (
    <button
      key={t.key}
      className="pro-navbtn"
      onClick={() => setTab(t.key)}
      aria-current={tab === t.key ? "page" : undefined}
    >
      {t.label}
    </button>
  ));

  const muted = "rgba(31,31,31,0.56)";

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: MONO }}>
      <Helmet>
        <title>Painel. SalbCare Pro</title>
        <meta name="robots" content="noindex" />
        <link rel="stylesheet" href={PRO_FONTS_HREF} />
      </Helmet>
      <style>{proStyles + dashStyles}</style>

      <header
        className="pro-wrap pro-wrap--wide"
        style={{ paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Link to="/" style={{ color: muted, fontSize: 12, textDecoration: "none" }}>
          Voltar ao site
        </Link>
        <span style={{ fontSize: 12, color: published ? TEAL : muted }}>
          {published ? "Perfil publicado" : "Perfil não publicado"}
        </span>
      </header>

      <section className="pro-wrap pro-wrap--wide" style={{ paddingTop: 36, paddingBottom: 24 }}>
        <ProLabel>SalbCare Pro</ProLabel>
        <h1 className="pro-h1" style={{ fontSize: 32 }}>Painel</h1>
      </section>

      <div className="pro-wrap pro-wrap--wide pro-dashpad" style={{ paddingBottom: 72 }}>
        <div className="pro-dash">
          <nav className="pro-sidenav" aria-label="Secoes do painel">
            {navButtons}
          </nav>

          <section style={{ display: "grid", gap: 18 }}>
            {tab === "perfil" && (
              <div className="pro-card">
                <ProProfileFields form={form} setForm={setForm} userId={user?.id ?? ""} />
                <div style={{ display: "grid", gap: 10, marginTop: 22 }}>
                  <button
                    className="pro-cta"
                    style={{ background: GOLD, color: NAVY }}
                    disabled={savingProfile}
                    onClick={() => saveProfile(true)}
                  >
                    {savingProfile ? "Salvando" : "Salvar e publicar"}
                  </button>
                  {published && (
                    <button
                      className="pro-cta"
                      style={{ background: "transparent", color: CREAM, border: "1px solid rgba(31,31,31,0.2)" }}
                      onClick={() => saveProfile(false)}
                    >
                      Despublicar minha pagina
                    </button>
                  )}
                </div>
              </div>
            )}

            {tab === "agenda" && (
              <>
                <div className="pro-card" style={{ display: "grid", gap: 12 }}>
                  <ProLabel>Novo atendimento</ProLabel>
                  <select
                    className="pro-input"
                    value={newAppt.patient_id}
                    onChange={(e) => setNewAppt({ ...newAppt, patient_id: e.target.value })}
                  >
                    <option value="">Paciente cadastrado (opcional)</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {!newAppt.patient_id && (
                    <input
                      className="pro-input"
                      placeholder="Nome do paciente"
                      value={newAppt.patient_name}
                      onChange={(e) => setNewAppt({ ...newAppt, patient_name: e.target.value })}
                    />
                  )}
                  <input
                    className="pro-input"
                    type="datetime-local"
                    value={newAppt.scheduled_at}
                    onChange={(e) => setNewAppt({ ...newAppt, scheduled_at: e.target.value })}
                  />
                  <input
                    className="pro-input"
                    placeholder="Serviço (opcional)"
                    value={newAppt.service}
                    onChange={(e) => setNewAppt({ ...newAppt, service: e.target.value })}
                  />
                  <button className="pro-cta" style={{ background: TEAL, color: NAVY }} onClick={addAppointment}>
                    Adicionar
                  </button>
                </div>

                <div className="pro-card" style={{ display: "grid", gap: 12 }}>
                  <ProLabel>Próximos atendimentos</ProLabel>
                  {appointments.length === 0 && (
                    <p style={{ margin: 0, fontSize: 13, color: muted }}>Nenhum atendimento agendado.</p>
                  )}
                  {appointments.map((a) => (
                    <div key={a.id} className="pro-row">
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.patient_name}</div>
                        <div style={{ color: muted }}>
                          {new Date(a.scheduled_at).toLocaleString("pt-BR")} {a.service ? `· ${a.service}` : ""}
                        </div>
                      </div>
                      <button className="pro-ghostbtn" onClick={() => removeAppointment(a.id)}>
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "pacientes" && (
              <>
                <div className="pro-card" style={{ display: "grid", gap: 12 }}>
                  <ProLabel>Novo paciente</ProLabel>
                  <input
                    className="pro-input"
                    placeholder="Nome"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  />
                  <div className="pro-grid2">
                    <input
                      className="pro-input"
                      placeholder="Telefone ou WhatsApp"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    />
                    <input
                      className="pro-input"
                      placeholder="Email"
                      value={newPatient.email}
                      onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    />
                  </div>
                  <div className="pro-grid2">
                    <input
                      className="pro-input"
                      placeholder="Cidade"
                      value={newPatient.city}
                      onChange={(e) => setNewPatient({ ...newPatient, city: e.target.value })}
                    />
                    <input
                      className="pro-input"
                      placeholder="Idioma preferido"
                      value={newPatient.preferred_language}
                      onChange={(e) => setNewPatient({ ...newPatient, preferred_language: e.target.value })}
                    />
                  </div>
                  <textarea
                    className="pro-input"
                    rows={3}
                    placeholder="Observacoes gerais de contato"
                    value={newPatient.notes}
                    onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                  />
                  <button className="pro-cta" style={{ background: TEAL, color: NAVY }} onClick={addPatient}>
                    Adicionar
                  </button>
                </div>

                <div className="pro-card" style={{ display: "grid", gap: 12 }}>
                  <ProLabel>Meus pacientes</ProLabel>
                  {patients.length === 0 && (
                    <p style={{ margin: 0, fontSize: 13, color: muted }}>Nenhum paciente cadastrado.</p>
                  )}
                  {patients.map((p) => (
                    <div key={p.id} className="pro-row">
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ color: muted }}>
                          {[p.phone, p.city, p.preferred_language].filter(Boolean).join(" · ") || "Sem contato"}
                        </div>
                      </div>
                      <button className="pro-ghostbtn" onClick={() => removePatient(p.id)}>
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "financeiro" && (
              <>
                <div className="pro-card" style={{ display: "grid", gap: 8 }}>
                  <ProLabel>Este mês</ProLabel>
                  <div style={{ fontSize: 13, color: muted }}>Receitas {brl(monthTotals.income)}</div>
                  <div style={{ fontSize: 13, color: muted }}>Despesas {brl(monthTotals.expense)}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, color: TEAL }}>
                    {brl(monthTotals.balance)}
                  </div>
                </div>

                <div className="pro-card" style={{ display: "grid", gap: 12 }}>
                  <ProLabel>Novo lançamento</ProLabel>
                  <input
                    className="pro-input"
                    placeholder="Descrição"
                    value={newTx.description}
                    onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                  />
                  <div className="pro-grid2">
                    <input
                      className="pro-input"
                      placeholder="Valor"
                      inputMode="decimal"
                      value={newTx.amount}
                      onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                    />
                    <input
                      className="pro-input"
                      type="date"
                      value={newTx.date}
                      onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                    />
                  </div>
                  <select
                    className="pro-input"
                    value={newTx.type}
                    onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
                  >
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                  </select>
                  <select
                    className="pro-input"
                    value={newTx.pro_appointment_id}
                    onChange={(e) => setNewTx({ ...newTx, pro_appointment_id: e.target.value })}
                  >
                    <option value="">Vincular a um atendimento (opcional)</option>
                    {appointments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.patient_name} · {new Date(a.scheduled_at).toLocaleDateString("pt-BR")}
                      </option>
                    ))}
                  </select>
                  <button className="pro-cta" style={{ background: TEAL, color: NAVY }} onClick={addTransaction}>
                    Adicionar
                  </button>
                </div>

                <div className="pro-card" style={{ display: "grid", gap: 12 }}>
                  <ProLabel>Lançamentos</ProLabel>
                  {transactions.length === 0 && (
                    <p style={{ margin: 0, fontSize: 13, color: muted }}>Nenhum lancamento registrado.</p>
                  )}
                  {transactions.map((t) => (
                    <div key={t.id} className="pro-row">
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.description}</div>
                        <div style={{ color: muted }}>
                          {new Date(`${t.date}T00:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                          {t.type === "expense" ? "Despesa" : "Receita"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span style={{ color: t.type === "expense" ? GOLD : TEAL }}>{brl(Number(t.amount) || 0)}</span>
                        <button className="pro-ghostbtn" onClick={() => removeTransaction(t.id)}>
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "materiais" && (
              <div className="pro-card" style={{ display: "grid", gap: 12 }}>
                <ProLabel>Materiais de atendimento</ProLabel>
                {materials.length === 0 && (
                  <p style={{ margin: 0, fontSize: 13, color: muted }}>
                    Os materiais aparecem aqui assim que forem publicados pela equipe.
                  </p>
                )}
                {materials.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => downloadMaterial(m.name)}
                    style={{
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      borderTop: "1px solid rgba(31,31,31,0.12)",
                      paddingTop: 10,
                      color: CREAM,
                      fontFamily: MONO,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}

            {tab === "assinatura" && (
              <div className="pro-card" style={{ display: "grid", gap: 12 }}>
                <ProLabel>Assinatura</ProLabel>
                <div style={{ fontSize: 14 }}>
                  Plano {subscription?.plan === "annual" ? "Anual Fundador" : "Mensal"} · status {subscription?.status}
                </div>
                {subscription?.current_period_end && (
                  <div style={{ fontSize: 13, color: muted }}>
                    Proxima renovacao em {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                  </div>
                )}
                <button className="pro-cta" style={{ background: GOLD, color: NAVY }} onClick={openPortal}>
                  Gerenciar pagamento
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      <nav className="pro-bottomnav" aria-label="Secoes do painel">
        {navButtons}
      </nav>
    </div>
  );
};

export default ProDashboard;
