import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

interface QrPartner {
  id: string;
  pousada_name: string;
  slug: string;
  full_url: string;
}

const AdminQrPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<QrPartner | null>(null);
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!id) return;
    supabase.from("qr_partners" as any).select("*").eq("id", id).single().then(({ data }) => {
      if (data) setRow(data as unknown as QrPartner);
    });
  }, [id]);

  useEffect(() => {
    if (!row) return;
    QRCode.toDataURL(row.full_url, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#0d2818", light: "#ffffff" },
    }).then(setQr);
  }, [row]);

  useEffect(() => {
    if (row && qr) setTimeout(() => window.print(), 400);
  }, [row, qr]);

  if (!row) return <div className="p-8 text-center">Carregando…</div>;

  const displayUrl = row.full_url.replace(/^https?:\/\//, "");

  return (
    <>
      <style>{`
        @page { size: A6 portrait; margin: 6mm; }
        body { background: #fff; }
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="min-h-screen flex items-center justify-center bg-white text-[#0d2818] p-6 print:p-0">
        <div className="w-full max-w-[360px] text-center space-y-4">
          <div className="text-2xl font-bold tracking-tight">SalbCare</div>
          <div className="text-xl font-semibold">{row.pousada_name}</div>
          {qr && <img src={qr} alt="QR" className="mx-auto" width={300} height={300} />}
          <div className="font-mono text-xs break-all">{displayUrl}</div>
          <div className="text-[10px] text-[#0d2818]/70 italic">
            Scan to book dental, physio or telehealth in English &amp; Spanish
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminQrPrintPage;
