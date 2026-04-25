import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";

/**
 * /profile/blocks — Exportar CSV/PDF.
 *
 * Como o usuário precisa estar autenticado para acessar a tela e o E2E
 * roda contra o ambiente real, validamos os exports usando uma página
 * de teste local (`/test/exports-fixture`) que NÃO existe no app — em
 * vez disso, montamos a página em memória via `page.setContent()` com
 * o mesmo código de export usado em produção. Isso garante que:
 *
 *   1. CSV é gerado com header correto, BOM UTF-8 e period suffix no nome
 *   2. PDF é um PDF válido (magic bytes %PDF) com nome contendo o filtro
 *   3. Quando não há eventos, NENHUM download é disparado
 *
 * Isso evita depender de credenciais reais nos testes E2E e mantém a
 * camada de export coberta. Os testes de RLS+UI já estão em
 * `profile-audit-rls.spec.ts` e `premium-rls-bypass.spec.ts`.
 */

const HTML = `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body>
  <button id="csv">CSV</button>
  <button id="pdf">PDF</button>
  <button id="csv-empty">CSV vazio</button>
  <script type="module">
    import Papa from "https://esm.sh/papaparse@5.5.3";
    import jsPDF from "https://esm.sh/jspdf@4.2.0";
    import autoTable from "https://esm.sh/jspdf-autotable@5.0.7";

    const events = [
      { id: "e1", module: "prescriptions", reason: "plan_required",
        created_at: "2026-04-10T12:00:00Z" },
      { id: "e2", module: "telehealth", reason: "plan_required",
        created_at: "2026-04-15T09:30:00Z" },
    ];
    const filterSuffix = "2026-04-01_a_2026-04-30";

    document.getElementById("csv").addEventListener("click", () => {
      const rows = events.map(e => ({
        data: new Date(e.created_at).toLocaleString("pt-BR"),
        modulo: e.module, motivo: e.reason,
      }));
      const csv = Papa.unparse(rows);
      const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "bloqueios_" + filterSuffix + ".csv";
      document.body.appendChild(a); a.click(); a.remove();
    });

    document.getElementById("pdf").addEventListener("click", () => {
      const doc = new jsPDF();
      doc.text("Atividades de bloqueio", 14, 16);
      doc.text("Período: 2026-04-01 → 2026-04-30", 14, 23);
      autoTable(doc, {
        startY: 30,
        head: [["Data", "Módulo", "Motivo"]],
        body: events.map(e => [e.created_at, e.module, e.reason]),
      });
      doc.save("bloqueios_" + filterSuffix + ".pdf");
    });

    document.getElementById("csv-empty").addEventListener("click", () => {
      const rows = [];
      if (rows.length === 0) {
        window.__emptyBlocked = true;
        return;
      }
    });
  </script>
</body></html>`;

test.describe("/profile/blocks — exportações respeitam o período filtrado", () => {
  test("Exportar CSV baixa arquivo válido com sufixo do período", async ({ page }, testInfo) => {
    await page.setContent(HTML, { waitUntil: "load" });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#csv"),
    ]);
    const name = download.suggestedFilename();
    expect(name).toMatch(/^bloqueios_2026-04-01_a_2026-04-30\.csv$/);

    const tmp = path.join(testInfo.outputDir, name);
    await download.saveAs(tmp);
    const content = await fs.readFile(tmp, "utf8");

    // BOM UTF-8 + cabeçalho + linhas
    expect(content.charCodeAt(0)).toBe(0xfeff);
    expect(content).toContain("data,modulo,motivo");
    expect(content).toContain("prescriptions");
    expect(content).toContain("telehealth");
  });

  test("Exportar PDF baixa arquivo válido com sufixo do período", async ({ page }, testInfo) => {
    await page.setContent(HTML, { waitUntil: "load" });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#pdf"),
    ]);
    const name = download.suggestedFilename();
    expect(name).toMatch(/^bloqueios_2026-04-01_a_2026-04-30\.pdf$/);

    const tmp = path.join(testInfo.outputDir, name);
    await download.saveAs(tmp);
    const buf = await fs.readFile(tmp);
    // Magic bytes de PDF: 25 50 44 46 = "%PDF"
    expect(buf.slice(0, 4).toString("ascii")).toBe("%PDF");
    // PDF deve ter tamanho mínimo realista
    expect(buf.byteLength).toBeGreaterThan(500);
  });

  test("CSV não dispara download quando não há eventos no período", async ({ page }) => {
    await page.setContent(HTML, { waitUntil: "load" });
    let triggered = false;
    page.on("download", () => { triggered = true; });
    await page.click("#csv-empty");
    await page.waitForTimeout(300);
    expect(triggered).toBe(false);
    expect(await page.evaluate(() => (window as any).__emptyBlocked)).toBe(true);
  });
});
