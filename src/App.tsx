import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProfessionalRoute from "@/components/ProfessionalRoute";
import BottomNav from "@/components/BottomNav";
import CookieConsent from "./components/CookieConsent";
import PageSkeleton from "@/components/PageSkeleton";
import PageContainer from "@/components/PageContainer";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import { lazyWithRetry } from "@/utils/lazyWithRetry";

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
const Profile = lazyWithRetry(() => import("./pages/Profile"), "Profile");
const Subscription = lazyWithRetry(() => import("./pages/Subscription"), "Subscription");
const NotFound = lazyWithRetry(() => import("./pages/NotFound"), "NotFound");
const CeoDashboard = lazyWithRetry(() => import("./pages/CeoDashboard"), "CeoDashboard");
const Terms = lazyWithRetry(() => import("./pages/Terms"), "Terms");
const Privacy = lazyWithRetry(() => import("./pages/Privacy"), "Privacy");
const Index = lazyWithRetry(() => import("./pages/Index"), "Index");
const PublicProfile = lazyWithRetry(() => import("./pages/PublicProfile"), "PublicProfile");
const Diagnostico = lazyWithRetry(() => import("./pages/Diagnostico"), "Diagnostico");
const Checkout = lazyWithRetry(() => import("./pages/Checkout"), "Checkout");
const PaymentSuccess = lazyWithRetry(() => import("./pages/PaymentSuccess"), "PaymentSuccess");
const Sucesso = lazyWithRetry(() => import("./pages/Sucesso"), "Sucesso");
const Cancelado = lazyWithRetry(() => import("./pages/Cancelado"), "Cancelado");

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
              <Route path="/planos" element={<Subscription />} />

              {/* Professional-only routes */}
              <Route path="/checkout" element={<ProfessionalRoute><Checkout /></ProfessionalRoute>} />
              <Route path="/payment-success" element={<ProfessionalRoute><PaymentSuccess /></ProfessionalRoute>} />
              <Route path="/sucesso" element={<ProfessionalRoute><Sucesso /></ProfessionalRoute>} />
              <Route path="/cancelado" element={<ProfessionalRoute><Cancelado /></ProfessionalRoute>} />
              <Route path="/dashboard" element={<ProfessionalRoute><Dashboard /></ProfessionalRoute>} />
              <Route path="/dashboard/financeiro" element={<ProfessionalRoute><DashboardFinanceiro /></ProfessionalRoute>} />
              <Route path="/dashboard/mentoria" element={<ProfessionalRoute><DashboardMentoria /></ProfessionalRoute>} />
              <Route path="/dashboard/teleconsulta" element={<ProfessionalRoute><DashboardTeleconsulta /></ProfessionalRoute>} />
              <Route path="/profile" element={<ProfessionalRoute><Profile /></ProfessionalRoute>} />
              <Route path="/subscription" element={<ProfessionalRoute><Subscription /></ProfessionalRoute>} />
              <Route path="/admin" element={<CeoDashboard />} />

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
