import PageContainer from "@/components/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LegalDashboardTab from "@/components/legal/LegalDashboardTab";
import LawyerPartnersTab from "@/components/legal/LawyerPartnersTab";
import LegalTemplatesTab from "@/components/legal/LegalTemplatesTab";
import FeatureGate from "@/components/FeatureGate";
import { useAuth } from "@/contexts/AuthContext";
import PremiumOnlyGuard from "@/components/PremiumOnlyGuard";

const LegalInner = () => {
  const { user } = useAuth();
  return (
    <PageContainer backTo="/dashboard">
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Suporte Jurídico</h1>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-auto">
            <TabsTrigger value="dashboard" className="text-xs px-2 py-2">Painel</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs px-2 py-2">Modelos</TabsTrigger>
            <TabsTrigger value="partners" className="text-xs px-2 py-2">Advogados</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><LegalDashboardTab /></TabsContent>
          <TabsContent value="templates"><LegalTemplatesTab /></TabsContent>
          <TabsContent value="partners"><FeatureGate feature="legal_partners"><LawyerPartnersTab /></FeatureGate></TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

const Legal = () => (
  <PremiumOnlyGuard
    feature="O Suporte Jurídico"
    description="Modelos jurídicos e a rede de advogados parceiros são liberados no plano Essencial."
    reason="legal"
    redirectAfter="/dashboard/juridico"
  >
    <LegalInner />
  </PremiumOnlyGuard>
);

export default Legal;
