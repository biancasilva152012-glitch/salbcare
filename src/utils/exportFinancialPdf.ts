import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
}

export function exportFinancialPdf(
  transactions: Transaction[],
  filterMonth: Date
) {
  const monthLabel = format(filterMonth, "MMMM yyyy", { locale: ptBR });
  const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const filterKey = format(filterMonth, "yyyy-MM");

  const filtered = transactions.filter((t) => t.date.substring(0, 7) === filterKey);
  const incomes = filtered.filter((t) => t.type === "income");
  const expenses = filtered.filter((t) => t.type === "expense");
  const totalIncome = incomes.reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const profit = totalIncome - totalExpense;

  const doc = new jsPDF();
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  // Header
  doc.setFontSize(18);
  doc.text("Relatório Financeiro", 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(capitalizedLabel, 14, 28);
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 34);

  // Summary box
  doc.setDrawColor(200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, 40, 182, 24, 2, 2, "FD");

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text("Receitas", 24, 49);
  doc.text("Despesas", 84, 49);
  doc.text("Lucro", 144, 49);

  doc.setFontSize(13);
  doc.setTextColor(34, 139, 34);
  doc.text(fmt(totalIncome), 24, 58);
  doc.setTextColor(220, 38, 38);
  doc.text(fmt(totalExpense), 84, 58);
  doc.setTextColor(profit >= 0 ? 34 : 220, profit >= 0 ? 139 : 38, profit >= 0 ? 34 : 38);
  doc.text(fmt(profit), 144, 58);

  // Transactions table
  const rows = filtered
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR"),
      t.description,
      t.type === "income" ? "Receita" : "Despesa",
      `${t.type === "income" ? "+" : "-"}${fmt(Number(t.amount))}`,
    ]);

  autoTable(doc, {
    startY: 72,
    head: [["Data", "Descrição", "Tipo", "Valor"]],
    body: rows.length > 0 ? rows : [["—", "Nenhuma transação neste mês", "—", "—"]],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [60, 60, 60], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { cellWidth: 24 },
      3: { cellWidth: 36, halign: "right" },
    },
  });

  doc.save(`relatorio-financeiro-${filterKey}.pdf`);
}
