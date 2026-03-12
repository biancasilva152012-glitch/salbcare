import PageContainer from "@/components/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CnpjRequestTab from "@/components/accounting/CnpjRequestTab";
import InvoicesTab from "@/components/accounting/InvoicesTab";
import TaxCalculationTab from "@/components/accounting/TaxCalculationTab";
import AccountingDashboardTab from "@/components/accounting/AccountingDashboardTab";
import MarketplaceTab from "@/components/accounting/MarketplaceTab";
import FeatureGate from "@/components/FeatureGate";

const Accounting = () => {
  return (
    <PageContainer>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Contabilidade</h1>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto">
            <TabsTrigger value="dashboard" className="text-[10px] px-1 py-2">Painel</TabsTrigger>
            <TabsTrigger value="cnpj" className="text-[10px] px-1 py-2">CNPJ</TabsTrigger>
            <TabsTrigger value="invoices" className="text-[10px] px-1 py-2">Notas</TabsTrigger>
            <TabsTrigger value="taxes" className="text-[10px] px-1 py-2">Impostos</TabsTrigger>
            <TabsTrigger value="marketplace" className="text-[10px] px-1 py-2">Parceiros</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><AccountingDashboardTab /></TabsContent>
          <TabsContent value="cnpj"><CnpjRequestTab /></TabsContent>
          <TabsContent value="invoices"><InvoicesTab /></TabsContent>
          <TabsContent value="taxes"><TaxCalculationTab /></TabsContent>
          <TabsContent value="marketplace"><FeatureGate feature="accounting_marketplace"><MarketplaceTab /></FeatureGate></TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default Accounting;
