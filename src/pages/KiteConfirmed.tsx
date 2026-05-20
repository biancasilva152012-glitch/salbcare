import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

type SessionInfo = {
  paid: boolean;
  amount_paid: number;
  procedure: string | null;
  type: "presencial" | "online" | null;
  patient_name: string | null;
  preferred_date: string | null;
  time_preference: string | null;
  remaining_balance: number;
};

export default function KiteConfirmed() {
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get("session_id");
    if (!sid) { setErr("Missing session"); return; }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-kite-session", {
          method: "GET",
          // @ts-expect-error supabase-js typing
          query: { session_id: sid },
        });
        if (error) {
          // Fallback: direct fetch with query string
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-kite-session?session_id=${encodeURIComponent(sid)}`;
          const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
          const j = await res.json();
          if (!res.ok) throw new Error(j?.error || "Failed");
          setInfo(j);
        } else {
          setInfo(data as SessionInfo);
        }
      } catch (e: any) {
        setErr(e?.message || "Could not load");
      }
    })();
  }, []);

  const isOnline = info?.type === "online";

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f7f3ee", color: "#1a1612", minHeight: "100vh" }} className="flex flex-col">
      <Helmet>
        <html lang="en" />
        <title>Booking confirmed — SalbDental</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </Helmet>

      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="max-w-xl w-full bg-white rounded-2xl p-8 md:p-10 border border-black/5 shadow-sm">
          {err && <p className="text-red-600 text-center">{err}</p>}
          {!err && !info && <p className="text-center text-[#5a564f]">Loading your booking…</p>}
          {info && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2c6e49]/10 text-[#2c6e49] text-2xl mb-4">✓</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl md:text-4xl mb-3">
                  {isOnline ? "You're all set!" : "You're booked!"}
                </h1>
                <p className="text-[#5a564f]">
                  {isOnline
                    ? "Check your email — your Google Meet link will arrive within 2 hours."
                    : "We'll confirm your exact time within 2 hours. Pay the remaining balance at the clinic on arrival."}
                </p>
              </div>

              <div className="border-t border-black/5 pt-5 space-y-2 text-sm">
                <Row k="Procedure" v={info.procedure || "—"} />
                <Row k="Type" v={isOnline ? "Online consultation" : "In-person"} />
                <Row k="Amount paid" v={`R$ ${info.amount_paid.toFixed(2)}`} />
                {!isOnline && info.remaining_balance > 0 && (
                  <Row k="Pay at clinic" v={`R$ ${info.remaining_balance.toFixed(2)}`} highlight />
                )}
                <Row k="Preferred date" v={info.preferred_date || "—"} />
                <Row k="Time" v={info.time_preference || "any"} />
              </div>

              {info.preferred_date && (
                <a
                  href={buildGCalUrl(info)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block text-center w-full px-5 py-3 rounded-full bg-[#2c6e49] text-white font-semibold hover:bg-[#1a3a2a]"
                >
                  Add to Google Calendar
                </a>
              )}
              <a href="/kite" className="block text-center mt-3 text-sm text-[#5a564f] hover:text-[#1a1612]">← Back to SalbDental</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#5a564f]">{k}</span>
      <span className={highlight ? "font-semibold text-amber-700" : "font-medium"}>{v}</span>
    </div>
  );
}

function buildGCalUrl(info: SessionInfo): string {
  const d = (info.preferred_date || "").replace(/-/g, "");
  const title = encodeURIComponent(`SalbDental — ${info.procedure || "Appointment"}`);
  const details = encodeURIComponent(
    info.type === "online"
      ? "Online consultation. Google Meet link will arrive by email."
      : "In-person appointment at SalbDental — Ilha do Guajiru. Pay remaining balance at the clinic."
  );
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${d}/${d}&details=${details}`;
}
