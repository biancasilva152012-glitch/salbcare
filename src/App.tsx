import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProfessionalRoute from "@/components/ProfessionalRoute";
import PremiumRoute from "@/components/PremiumRoute";
import BottomNav from "@/components/BottomNav";
import CookieConsent from "./components/CookieConsent";
import PageSkeleton from "@/components/PageSkeleton";
import PageContainer from "@/components/PageContainer";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import GlobalDemoMigration from "@/components/GlobalDemoMigration";
import GuestDataSyncRedirector from "@/components/GuestDataSyncRedirector";
import GlobalStatusBanner from "@/components/GlobalStatusBanner";
import FreemiumDebugPanel from "@/components/FreemiumDebugPanel";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useTracking } from "@/hooks/useTracking";

const TrackingProvider = () => { useTracking(); return null; };

// Eager: login, register, landing (entry points)
import Login from "./pages/Login";
import Register from "./pages/Register";
import ParaProfissionais from "./pages/ParaProfissionais";

// Lazy with auto-retry
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"), "ForgotPassword");
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"), "ResetPassword");
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"), "Dashboard");
const DashboardFinanceiro = lazyWithRetry(() => import("./pages/DashboardFinanceiro"), "DashboardFinanceiro");
const DashboardMentoria = lazyWithRetry(() => import("./pages/DashboardMentoria"), "DashboardMentoria");
const DashboardTeleconsulta = lazyWithRetry(() => import("./pages/DashboardTeleconsulta"), "DashboardTeleconsulta");
const Financial = lazyWithRetry(() => import("./pages/Financial"), "Financial");
const Accounting = lazyWithRetry(() => import("./pages/Accounting"), "Accounting");
const Agenda = lazyWithRetry(() => import("./pages/Agenda"), "Agenda");
const Patients = lazyWithRetry(() => import("./pages/Patients"), "Patients");
const Legal = lazyWithRetry(() => import("./pages/Legal"), "Legal");
const Telehealth = lazyWithRetry(() => import("./pages/Telehealth"), "Telehealth");
const Profile = lazyWithRetry(() => import("./pages/Profile"), "Profile");

const ProfileBlocks = lazyWithRetry(() => import("./pages/ProfileBlocks"), "ProfileBlocks");
const SalbScore = lazyWithRetry(() => import("./pages/SalbScore"), "SalbScore");
const VerifyDocument = lazyWithRetry(() => import("./pages/VerifyDocument"), "VerifyDocument");
const Subscription = lazyWithRetry(() => import("./pages/Subscription"), "Subscription");
const Upgrade = lazyWithRetry(() => import("./pages/Upgrade"), "Upgrade");
const DashboardLimits = lazyWithRetry(() => import("./pages/DashboardLimits"), "DashboardLimits");
const SyncGuestData = lazyWithRetry(() => import("./pages/SyncGuestData"), "SyncGuestData");
const SyncGuestDataDone = lazyWithRetry(() => import("./pages/SyncGuestDataDone"), "SyncGuestDataDone");
const Experimente = lazyWithRetry(() => import("./pages/Experimente"), "Experimente");
const GuestEntry = lazyWithRetry(() => import("./pages/GuestEntry"), "GuestEntry");
const NotFound = lazyWithRetry(() => import("./pages/NotFound"), "NotFound");
const CeoDashboard = lazyWithRetry(() => import("./pages/CeoDashboard"), "CeoDashboard");
const AdminOverviewPage = lazyWithRetry(() => import("./pages/admin/AdminOverviewPage"), "AdminOverviewPage");
const AdminUsersPage = lazyWithRetry(() => import("./pages/admin/AdminUsersPage"), "AdminUsersPage");
const AdminSubscriptionsPage = lazyWithRetry(() => import("./pages/admin/AdminSubscriptionsPage"), "AdminSubscriptionsPage");
const AdminPlaceholder = lazyWithRetry(() => import("./pages/admin/AdminPlaceholder"), "AdminPlaceholder");
const AdminDatabasePage = lazyWithRetry(() => import("./pages/admin/AdminDatabasePage"), "AdminDatabasePage");
const AdminLogsPage = lazyWithRetry(() => import("./pages/admin/AdminLogsPage"), "AdminLogsPage");
const AdminFinancePage = lazyWithRetry(() => import("./pages/admin/AdminFinancePage"), "AdminFinancePage");
const AdminSettingsPage = lazyWithRetry(() => import("./pages/admin/AdminSettingsPage"), "AdminSettingsPage");
const AdminPartnersPage = lazyWithRetry(() => import("./pages/admin/AdminPartnersPage"), "AdminPartnersPage");
const AdminRolesPage = lazyWithRetry(() => import("./pages/admin/AdminRolesPage"), "AdminRolesPage");
const AdminRlsAuditPage = lazyWithRetry(() => import("./pages/admin/AdminRlsAuditPage"), "AdminRlsAuditPage");
const Terms = lazyWithRetry(() => import("./pages/Terms"), "Terms");
const Privacy = lazyWithRetry(() => import("./pages/Privacy"), "Privacy");
const Index = lazyWithRetry(() => import("./pages/Index"), "Index");
const PublicProfile = lazyWithRetry(() => import("./pages/PublicProfile"), "PublicProfile");
const ConsultaOnlineIndex = lazyWithRetry(() => import("./pages/ConsultaOnlineIndex"), "ConsultaOnlineIndex");
const SpecialtyListing = lazyWithRetry(() => import("./pages/SpecialtyListing"), "SpecialtyListing");
const Diagnostico = lazyWithRetry(() => import("./pages/Diagnostico"), "Diagnostico");
const Checkout = lazyWithRetry(() => import("./pages/Checkout"), "Checkout");
const PaymentSuccess = lazyWithRetry(() => import("./pages/PaymentSuccess"), "PaymentSuccess");
const Sucesso = lazyWithRetry(() => import("./pages/Sucesso"), "Sucesso");
const Cancelado = lazyWithRetry(() => import("./pages/Cancelado"), "Cancelado");
const ProntoAtendimento = lazyWithRetry(() => import("./pages/ProntoAtendimento"), "ProntoAtendimento");
const ProntoAtendimentoFlow = lazyWithRetry(() => import("./pages/ProntoAtendimentoFlow"), "ProntoAtendimentoFlow");
const ProntoAtendimentoHistorico = lazyWithRetry(() => import("./pages/ProntoAtendimentoHistorico"), "ProntoAtendimentoHistorico");
const PublicProfessionals = lazyWithRetry(() => import("./pages/PublicProfessionals"), "PublicProfessionals");
const Pricing = lazyWithRetry(() => import("./pages/Pricing"), "Pricing");
const BlogIndex = lazyWithRetry(() => import("./pages/blog/BlogIndex"), "BlogIndex");
const BlogConsultaPsicologo = lazyWithRetry(() => import("./pages/blog/BlogConsultaPsicologo"), "BlogConsultaPsicologo");
const BlogProntuarioDentista = lazyWithRetry(() => import("./pages/blog/BlogProntuarioDentista"), "BlogProntuarioDentista");
const BlogTeleconsultaMedica = lazyWithRetry(() => import("./pages/blog/BlogTeleconsultaMedica"), "BlogTeleconsultaMedica");
const BlogGestaoFinanceira = lazyWithRetry(() => import("./pages/blog/BlogGestaoFinanceira"), "BlogGestaoFinanceira");
const BlogNutricionistaOnline = lazyWithRetry(() => import("./pages/blog/BlogNutricionistaOnline"), "BlogNutricionistaOnline");
const BlogAgendaMedica = lazyWithRetry(() => import("./pages/blog/BlogAgendaMedica"), "BlogAgendaMedica");
const BlogReceituarioDigital = lazyWithRetry(() => import("./pages/blog/BlogReceituarioDigital"), "BlogReceituarioDigital");
const BlogCnpjMedico = lazyWithRetry(() => import("./pages/blog/BlogCnpjMedico"), "BlogCnpjMedico");
const BlogPrecoMinimoConsulta = lazyWithRetry(() => import("./pages/blog/BlogPrecoMinimoConsulta"), "BlogPrecoMinimoConsulta");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LazyFallback = () => (
  <PageContainer>
    <PageSkeleton variant="list" />
  </PageContainer>
);

const App = () => (
  <GlobalErrorBoundary>
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <TrackingProvider />
          <GlobalDemoMigration />
          <GuestDataSyncRedirector />
          <GlobalStatusBanner />
          <FreemiumDebugPanel />
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<ParaProfissionais />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cadastro" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/para-profissionais" element={<ParaProfissionais />} />
              <Route path="/index" element={<Index />} />
              <Route path="/p/:slug" element={<PublicProfile />} />
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/profissionais" element={<PublicProfessionals />} />
              <Route path="/planos" element={<Pricing />} />
              <Route path="/precos" element={<Pricing />} />
              <Route path="/experimente" element={<Experimente />} />
              <Route path="/guest" element={<GuestEntry />} />
              <Route path="/upgrade" element={<Upgrade />} />

              {/* Blog SEO */}
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/consulta-online-psicologo" element={<BlogConsultaPsicologo />} />
              <Route path="/blog/prontuario-digital-dentista" element={<BlogProntuarioDentista />} />
              <Route path="/blog/teleconsulta-medica" element={<BlogTeleconsultaMedica />} />
              <Route path="/blog/gestao-financeira-profissional-saude" element={<BlogGestaoFinanceira />} />
              <Route path="/blog/nutricionista-online" element={<BlogNutricionistaOnline />} />
              <Route path="/blog/agenda-medica-digital" element={<BlogAgendaMedica />} />
              <Route path="/blog/receituario-digital" element={<BlogReceituarioDigital />} />
              <Route path="/blog/como-abrir-cnpj-medico" element={<BlogCnpjMedico />} />
              <Route path="/blog/preco-minimo-consulta" element={<BlogPrecoMinimoConsulta />} />

              {/* Public patient routes */}
              <Route path="/consulta-online" element={<ConsultaOnlineIndex />} />
              <Route path="/consulta-online/:specialty" element={<SpecialtyListing />} />
              <Route path="/pronto-atendimento" element={<ProntoAtendimento />} />
              <Route path="/pronto-atendimento/servico" element={<ProntoAtendimentoFlow />} />
              <Route path="/pronto-atendimento/historico" element={<ProntoAtendimentoHistorico />} />

              {/* Professional-only routes */}
              <Route path="/checkout" element={<ProfessionalRoute><Checkout /></ProfessionalRoute>} />
              <Route path="/payment-success" element={<ProfessionalRoute><PaymentSuccess /></ProfessionalRoute>} />
              <Route path="/sucesso" element={<ProfessionalRoute><Sucesso /></ProfessionalRoute>} />
              <Route path="/cancelado" element={<ProfessionalRoute><Cancelado /></ProfessionalRoute>} />
              {/* Guest-friendly: localStorage-backed UI when !user */}
              <Route path="/dashboard" element={<ProfessionalRoute allowGuest><Dashboard /></ProfessionalRoute>} />
              <Route path="/dashboard/agenda" element={<ProfessionalRoute allowGuest><Agenda /></ProfessionalRoute>} />
              <Route path="/dashboard/pacientes" element={<ProfessionalRoute allowGuest><Patients /></ProfessionalRoute>} />
              {/* Guest-paywall rendered inside the page when !user */}
              <Route path="/dashboard/financeiro" element={<ProfessionalRoute allowGuest><DashboardFinanceiro /></ProfessionalRoute>} />
              <Route path="/dashboard/financial" element={<ProfessionalRoute allowGuest><Financial /></ProfessionalRoute>} />
              <Route path="/dashboard/contabilidade" element={<PremiumRoute module="accounting"><Accounting /></PremiumRoute>} />
              <Route path="/dashboard/juridico" element={<PremiumRoute module="legal"><Legal /></PremiumRoute>} />
              <Route path="/dashboard/teleconsulta" element={<ProfessionalRoute allowGuest><DashboardTeleconsulta /></ProfessionalRoute>} />
              <Route path="/dashboard/telehealth" element={<ProfessionalRoute allowGuest><Telehealth /></ProfessionalRoute>} />
              <Route path="/dashboard/mentoria" element={<ProfessionalRoute allowGuest><DashboardMentoria /></ProfessionalRoute>} />
              <Route path="/dashboard/limites" element={<ProfessionalRoute allowGuest><DashboardLimits /></ProfessionalRoute>} />
              <Route path="/sync-guest-data" element={<ProfessionalRoute><SyncGuestData /></ProfessionalRoute>} />
              <Route path="/sync-guest-data/done" element={<ProfessionalRoute><SyncGuestDataDone /></ProfessionalRoute>} />
              <Route path="/profile" element={<ProfessionalRoute allowGuest><Profile /></ProfessionalRoute>} />
              
              <Route path="/profile/blocks" element={<ProfessionalRoute><ProfileBlocks /></ProfessionalRoute>} />
              <Route path="/perfil/salbscore" element={<ProfessionalRoute><SalbScore /></ProfessionalRoute>} />
              <Route path="/verificar" element={<VerifyDocument />} />
              <Route path="/verificar/:hash" element={<VerifyDocument />} />
              <Route path="/subscription" element={<ProfessionalRoute><Subscription /></ProfessionalRoute>} />
              <Route path="/admin" element={<AdminOverviewPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="/admin/finance" element={<AdminFinancePage />} />
              <Route path="/admin/database" element={<AdminDatabasePage />} />
              <Route path="/admin/logs" element={<AdminLogsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/partners" element={<AdminPartnersPage />} />
              <Route path="/admin/roles" element={<AdminRolesPage />} />
              <Route path="/admin/rls-audit" element={<AdminRlsAuditPage />} />
              <Route path="/admin-legacy" element={<CeoDashboard />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <BottomNav />
          <CookieConsent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
  </GlobalErrorBoundary>
);

export default App;
