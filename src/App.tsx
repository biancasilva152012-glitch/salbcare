import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import { useLocation, useParams } from "react-router-dom";

const TrackingProvider = () => { useTracking(); return null; };

// Generic redirect helper that preserves a single :slug param.
const SlugRedirect = ({ to }: { to: (slug: string) => string }) => {
  const { slug } = useParams();
  return <Navigate to={to(slug ?? "")} replace />;
};


// Hide the freemium debug widget on public routes and in production.
const FreemiumDebugPanelGate = () => {
  const { pathname } = useLocation();
  if (!import.meta.env.DEV) return null;
  if (pathname === "/" || pathname.startsWith("/kite")) return null;
  return <FreemiumDebugPanel />;
};

// Eager: login, register, landing (entry points)
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";

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
const SalbScoreDiagnostico = lazyWithRetry(() => import("./pages/SalbScoreDiagnostico"), "SalbScoreDiagnostico");
const SalbScoreSeloPreview = lazyWithRetry(() => import("./pages/SalbScoreSeloPreview"), "SalbScoreSeloPreview");
const PublicSalbScore = lazyWithRetry(() => import("./pages/PublicSalbScore"), "PublicSalbScore");
const SalbScoreSelo = lazyWithRetry(() => import("./pages/SalbScoreSelo"), "SalbScoreSelo");
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
const AdminLgpdAuditPage = lazyWithRetry(() => import("./pages/admin/AdminLgpdAuditPage"), "AdminLgpdAuditPage");
const AdminLgpdRequestsPage = lazyWithRetry(() => import("./pages/admin/AdminLgpdRequestsPage"), "AdminLgpdRequestsPage");
const AdminQrGeneratorPage = lazyWithRetry(() => import("./pages/admin/AdminQrGeneratorPage"), "AdminQrGeneratorPage");
const AdminQrPrintPage = lazyWithRetry(() => import("./pages/admin/AdminQrPrintPage"), "AdminQrPrintPage");
const AdminKiteBookingsPage = lazyWithRetry(() => import("./pages/admin/AdminKiteBookingsPage"), "AdminKiteBookingsPage");
const AdminKiteBookingDetailPage = lazyWithRetry(() => import("./pages/admin/AdminKiteBookingDetailPage"), "AdminKiteBookingDetailPage");
const Kite = lazyWithRetry(() => import("./pages/Kite"), "Kite");
const Hub = lazyWithRetry(() => import("./pages/Hub"), "Hub");
const Pro = lazyWithRetry(() => import("./pages/Pro"), "Pro");
const About = lazyWithRetry(() => import("./pages/About"), "About");
const Contact = lazyWithRetry(() => import("./pages/Contact"), "Contact");
const KiteConfirmed = lazyWithRetry(() => import("./pages/KiteConfirmed"), "KiteConfirmed");
const Terms = lazyWithRetry(() => import("./pages/Terms"), "Terms");
const Privacy = lazyWithRetry(() => import("./pages/Privacy"), "Privacy");
// Index é eager (rota raiz)
const BookingPublic = lazyWithRetry(() => import("./pages/BookingPublic"), "BookingPublic");
const ConsultaOnlineIndex = lazyWithRetry(() => import("./pages/ConsultaOnlineIndex"), "ConsultaOnlineIndex");
const SpecialtyListing = lazyWithRetry(() => import("./pages/SpecialtyListing"), "SpecialtyListing");
const Diagnostico = lazyWithRetry(() => import("./pages/Diagnostico"), "Diagnostico");
const Checkout = lazyWithRetry(() => import("./pages/Checkout"), "Checkout");
const PaymentSuccess = lazyWithRetry(() => import("./pages/PaymentSuccess"), "PaymentSuccess");
const Sucesso = lazyWithRetry(() => import("./pages/Sucesso"), "Sucesso");
const SubscriptionSuccess = lazyWithRetry(() => import("./pages/SubscriptionSuccess"), "SubscriptionSuccess");
const Cancelado = lazyWithRetry(() => import("./pages/Cancelado"), "Cancelado");
const ProntoAtendimento = lazyWithRetry(() => import("./pages/ProntoAtendimento"), "ProntoAtendimento");
const ProntoAtendimentoFlow = lazyWithRetry(() => import("./pages/ProntoAtendimentoFlow"), "ProntoAtendimentoFlow");
const ProntoAtendimentoHistorico = lazyWithRetry(() => import("./pages/ProntoAtendimentoHistorico"), "ProntoAtendimentoHistorico");

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
const BlogHome = lazyWithRetry(() => import("./pages/blog/BlogHome"), "BlogHome");
const BlogHub = lazyWithRetry(() => import("./pages/blog/BlogHub"), "BlogHub");
const PublicationHome = lazyWithRetry(() => import("./pages/blog/PublicationHome"), "PublicationHome");
const BlogArticle = lazyWithRetry(() => import("./pages/blog/BlogArticle"), "BlogArticle");
const AuthorPage = lazyWithRetry(() => import("./pages/blog/AuthorPage"), "AuthorPage");
const AdminBlogListPage = lazyWithRetry(() => import("./pages/admin/AdminBlogListPage"), "AdminBlogListPage");
const AdminBlogEditorPage = lazyWithRetry(() => import("./pages/admin/AdminBlogEditorPage"), "AdminBlogEditorPage");


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
          {/* FreemiumDebugPanelGate removed — debug widget no longer rendered globally */}
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              {/* Brand hub + alias for current SaaS landing (Index) */}
              <Route path="/hub" element={<Hub />} />
              <Route path="/pro" element={<Pro />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cadastro" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              {/* /para-profissionais e /index → redirect 301-like para a raiz unificada */}
              <Route path="/para-profissionais" element={<Navigate to="/" replace />} />
              <Route path="/index" element={<Navigate to="/" replace />} />
              {/* Public booking link (replaces old public profile /p/:slug and /profissionais directory) */}
              <Route path="/agendar/:token" element={<BookingPublic />} />
              <Route path="/p/:slug" element={<SlugRedirect to={(s) => `/agendar/${s}`} />} />
              <Route path="/profissionais" element={<Navigate to="/" replace />} />
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/planos" element={<Pricing />} />
              <Route path="/precos" element={<Pricing />} />
              <Route path="/experimente" element={<Experimente />} />
              <Route path="/guest" element={<GuestEntry />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/kite" element={<Kite />} />
              <Route path="/international" element={<Kite />} />
              <Route path="/kitecare" element={<Kite />} />
              <Route path="/kite/confirmed" element={<KiteConfirmed />} />
              <Route path="/international/confirmed" element={<KiteConfirmed />} />
              <Route path="/kitecare/confirmed" element={<KiteConfirmed />} />

              {/* ============================================================ */}
              {/* JOURNAL (formerly /blog) — canonical routes                  */}
              {/* ============================================================ */}

              {/* Static legacy SEO articles (PT) — now under /journal */}
              <Route path="/journal/consulta-online-psicologo" element={<BlogConsultaPsicologo />} />
              <Route path="/journal/prontuario-digital-dentista" element={<BlogProntuarioDentista />} />
              <Route path="/journal/teleconsulta-medica" element={<BlogTeleconsultaMedica />} />
              <Route path="/journal/gestao-financeira-profissional-saude" element={<BlogGestaoFinanceira />} />
              <Route path="/journal/nutricionista-online" element={<BlogNutricionistaOnline />} />
              <Route path="/journal/agenda-medica-digital" element={<BlogAgendaMedica />} />
              <Route path="/journal/receituario-digital" element={<BlogReceituarioDigital />} />
              <Route path="/journal/como-abrir-cnpj-medico" element={<BlogCnpjMedico />} />
              <Route path="/journal/preco-minimo-consulta" element={<BlogPrecoMinimoConsulta />} />

              {/* Hub — presents both publications */}
              <Route path="/journal" element={<BlogHub />} />
              <Route path="/pt/journal" element={<BlogHub />} />
              <Route path="/es/journal" element={<BlogHub />} />
              <Route path="/en/journal" element={<BlogHub />} />

              {/* Author page */}
              <Route path="/journal/author/:slug" element={<AuthorPage />} />
              <Route path="/pt/journal/author/:slug" element={<AuthorPage />} />
              <Route path="/es/journal/author/:slug" element={<AuthorPage />} />
              <Route path="/en/journal/author/:slug" element={<AuthorPage />} />

              {/* SalbCare Pro publication */}
              <Route path="/journal/pro" element={<PublicationHome publication="pro" />} />
              <Route path="/pt/journal/pro" element={<PublicationHome publication="pro" />} />
              <Route path="/es/journal/pro" element={<PublicationHome publication="pro" />} />
              <Route path="/en/journal/pro" element={<PublicationHome publication="pro" />} />
              <Route path="/journal/pro/:slug" element={<BlogArticle publicationSlug="pro" />} />
              <Route path="/pt/journal/pro/:slug" element={<BlogArticle publicationSlug="pro" forcedLang="pt" />} />
              <Route path="/es/journal/pro/:slug" element={<BlogArticle publicationSlug="pro" forcedLang="es" />} />
              <Route path="/en/journal/pro/:slug" element={<BlogArticle publicationSlug="pro" forcedLang="en" />} />

              {/* The SalbCare Journal (international) — URL segment "main" */}
              <Route path="/journal/main" element={<PublicationHome publication="journal" />} />
              <Route path="/pt/journal/main" element={<PublicationHome publication="journal" />} />
              <Route path="/es/journal/main" element={<PublicationHome publication="journal" />} />
              <Route path="/en/journal/main" element={<PublicationHome publication="journal" />} />
              <Route path="/journal/main/:slug" element={<BlogArticle publicationSlug="journal" />} />
              <Route path="/pt/journal/main/:slug" element={<BlogArticle publicationSlug="journal" forcedLang="pt" />} />
              <Route path="/es/journal/main/:slug" element={<BlogArticle publicationSlug="journal" forcedLang="es" />} />
              <Route path="/en/journal/main/:slug" element={<BlogArticle publicationSlug="journal" forcedLang="en" />} />

              {/* ============================================================ */}
              {/* 301-style redirects from old /blog/* paths → /journal/*       */}
              {/* ============================================================ */}
              <Route path="/blog" element={<Navigate to="/journal" replace />} />
              <Route path="/pt/blog" element={<Navigate to="/pt/journal" replace />} />
              <Route path="/es/blog" element={<Navigate to="/es/journal" replace />} />
              <Route path="/en/blog" element={<Navigate to="/en/journal" replace />} />

              <Route path="/blog/journal" element={<Navigate to="/journal/main" replace />} />
              <Route path="/pt/blog/journal" element={<Navigate to="/pt/journal/main" replace />} />
              <Route path="/es/blog/journal" element={<Navigate to="/es/journal/main" replace />} />
              <Route path="/en/blog/journal" element={<Navigate to="/en/journal/main" replace />} />
              <Route path="/blog/journal/:slug" element={<SlugRedirect to={(s) => `/journal/main/${s}`} />} />
              <Route path="/pt/blog/journal/:slug" element={<SlugRedirect to={(s) => `/pt/journal/main/${s}`} />} />
              <Route path="/es/blog/journal/:slug" element={<SlugRedirect to={(s) => `/es/journal/main/${s}`} />} />
              <Route path="/en/blog/journal/:slug" element={<SlugRedirect to={(s) => `/en/journal/main/${s}`} />} />

              <Route path="/blog/pro" element={<Navigate to="/journal/pro" replace />} />
              <Route path="/pt/blog/pro" element={<Navigate to="/pt/journal/pro" replace />} />
              <Route path="/es/blog/pro" element={<Navigate to="/es/journal/pro" replace />} />
              <Route path="/en/blog/pro" element={<Navigate to="/en/journal/pro" replace />} />
              <Route path="/blog/pro/:slug" element={<SlugRedirect to={(s) => `/journal/pro/${s}`} />} />
              <Route path="/pt/blog/pro/:slug" element={<SlugRedirect to={(s) => `/pt/journal/pro/${s}`} />} />
              <Route path="/es/blog/pro/:slug" element={<SlugRedirect to={(s) => `/es/journal/pro/${s}`} />} />
              <Route path="/en/blog/pro/:slug" element={<SlugRedirect to={(s) => `/en/journal/pro/${s}`} />} />

              <Route path="/blog/author/:slug" element={<SlugRedirect to={(s) => `/journal/author/${s}`} />} />
              <Route path="/pt/blog/author/:slug" element={<SlugRedirect to={(s) => `/pt/journal/author/${s}`} />} />
              <Route path="/es/blog/author/:slug" element={<SlugRedirect to={(s) => `/es/journal/author/${s}`} />} />
              <Route path="/en/blog/author/:slug" element={<SlugRedirect to={(s) => `/en/journal/author/${s}`} />} />

              {/* Legacy static articles — redirect old /blog paths to new /journal paths */}
              <Route path="/blog/consulta-online-psicologo" element={<Navigate to="/journal/consulta-online-psicologo" replace />} />
              <Route path="/blog/prontuario-digital-dentista" element={<Navigate to="/journal/prontuario-digital-dentista" replace />} />
              <Route path="/blog/teleconsulta-medica" element={<Navigate to="/journal/teleconsulta-medica" replace />} />
              <Route path="/blog/gestao-financeira-profissional-saude" element={<Navigate to="/journal/gestao-financeira-profissional-saude" replace />} />
              <Route path="/blog/nutricionista-online" element={<Navigate to="/journal/nutricionista-online" replace />} />
              <Route path="/blog/agenda-medica-digital" element={<Navigate to="/journal/agenda-medica-digital" replace />} />
              <Route path="/blog/receituario-digital" element={<Navigate to="/journal/receituario-digital" replace />} />
              <Route path="/blog/como-abrir-cnpj-medico" element={<Navigate to="/journal/como-abrir-cnpj-medico" replace />} />
              <Route path="/blog/preco-minimo-consulta" element={<Navigate to="/journal/preco-minimo-consulta" replace />} />

              {/* Legacy fallbacks */}
              <Route path="/journal/legacy-home" element={<BlogHome />} />
              <Route path="/journal/index" element={<BlogIndex />} />

              


              

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
              <Route path="/subscription-success" element={<ProfessionalRoute><SubscriptionSuccess /></ProfessionalRoute>} />
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
              <Route path="/perfil/salbscore/diagnostico" element={<ProfessionalRoute><SalbScoreDiagnostico /></ProfessionalRoute>} />
              <Route path="/perfil/salbscore/selo-exemplo" element={<ProfessionalRoute><SalbScoreSeloPreview /></ProfessionalRoute>} />
              <Route path="/salbscore" element={<PublicSalbScore />} />
              <Route path="/verificar" element={<VerifyDocument />} />
              <Route path="/verificar/:hash" element={<VerifyDocument />} />
              <Route path="/verificado/:slug" element={<SalbScoreSelo />} />
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
              <Route path="/admin/lgpd-audit" element={<AdminLgpdAuditPage />} />
              <Route path="/admin/lgpd-requests" element={<AdminLgpdRequestsPage />} />
              <Route path="/admin/qr-generator" element={<AdminQrGeneratorPage />} />
              <Route path="/admin/qr-generator/print/:id" element={<AdminQrPrintPage />} />
              <Route path="/admin/kite-bookings" element={<AdminKiteBookingsPage />} />
              <Route path="/admin/kite-bookings/:id" element={<AdminKiteBookingDetailPage />} />
              <Route path="/admin/blog" element={<AdminBlogListPage />} />
              <Route path="/admin/blog/:id" element={<AdminBlogEditorPage />} />
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
