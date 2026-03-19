import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProfessionalRoute from "@/components/ProfessionalRoute";
import PatientRoute from "@/components/PatientRoute";
import BottomNav from "@/components/BottomNav";
import CookieConsent from "./components/CookieConsent";
import PageSkeleton from "@/components/PageSkeleton";
import PageContainer from "@/components/PageContainer";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import { lazyWithRetry } from "@/utils/lazyWithRetry";

// Eager: login, register (entry points)
import Login from "./pages/Login";
import Register from "./pages/Register";

// Lazy with auto-retry on stale chunks after deploy
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"), "ForgotPassword");
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"), "ResetPassword");
const Onboarding = lazyWithRetry(() => import("./pages/Onboarding"), "Onboarding");
const Checkout = lazyWithRetry(() => import("./pages/Checkout"), "Checkout");
const PaymentSuccess = lazyWithRetry(() => import("./pages/PaymentSuccess"), "PaymentSuccess");
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"), "Dashboard");
const Agenda = lazyWithRetry(() => import("./pages/Agenda"), "Agenda");
const Patients = lazyWithRetry(() => import("./pages/Patients"), "Patients");
const Telehealth = lazyWithRetry(() => import("./pages/Telehealth"), "Telehealth");
const Professionals = lazyWithRetry(() => import("./pages/Professionals"), "Professionals");
const Financial = lazyWithRetry(() => import("./pages/Financial"), "Financial");
const Accounting = lazyWithRetry(() => import("./pages/Accounting"), "Accounting");
const Legal = lazyWithRetry(() => import("./pages/Legal"), "Legal");
const Profile = lazyWithRetry(() => import("./pages/Profile"), "Profile");
const Subscription = lazyWithRetry(() => import("./pages/Subscription"), "Subscription");
const NotFound = lazyWithRetry(() => import("./pages/NotFound"), "NotFound");
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"), "AdminDashboard");
const PatientBooking = lazyWithRetry(() => import("./pages/PatientBooking"), "PatientBooking");
const PatientRoom = lazyWithRetry(() => import("./pages/PatientRoom"), "PatientRoom");
const Terms = lazyWithRetry(() => import("./pages/Terms"), "Terms");
const Privacy = lazyWithRetry(() => import("./pages/Privacy"), "Privacy");
const Maintenance = lazyWithRetry(() => import("./pages/Maintenance"), "Maintenance");
const HowItWorks = lazyWithRetry(() => import("./pages/HowItWorks"), "HowItWorks");
const TestPrescriptionPdf = lazyWithRetry(() => import("./pages/TestPrescriptionPdf"), "TestPrescriptionPdf");
const Install = lazyWithRetry(() => import("./pages/Install"), "Install");
const Sucesso = lazyWithRetry(() => import("./pages/Sucesso"), "Sucesso");
const Cancelado = lazyWithRetry(() => import("./pages/Cancelado"), "Cancelado");
const SpecialtyDirectory = lazyWithRetry(() => import("./pages/SpecialtyDirectory"), "SpecialtyDirectory");
const ConsultaOnlineIndex = lazyWithRetry(() => import("./pages/ConsultaOnlineIndex"), "ConsultaOnlineIndex");
const PatientDashboard = lazyWithRetry(() => import("./pages/PatientDashboard"), "PatientDashboard");
const BookingSuccess = lazyWithRetry(() => import("./pages/BookingSuccess"), "BookingSuccess");
const VerifyDocument = lazyWithRetry(() => import("./pages/VerifyDocument"), "VerifyDocument");

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
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/booking" element={<PatientBooking />} />
              <Route path="/booking-success" element={<BookingSuccess />} />
              <Route path="/sala" element={<PatientRoom />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/como-funciona" element={<HowItWorks />} />
              <Route path="/test-pdf" element={<TestPrescriptionPdf />} />
              <Route path="/install" element={<Install />} />
              <Route path="/cancelado" element={<Cancelado />} />
              <Route path="/consulta-online" element={<ConsultaOnlineIndex />} />
              <Route path="/consulta-online/:specialty" element={<SpecialtyDirectory />} />
              <Route path="/verificar" element={<VerifyDocument />} />

              {/* Professional-only routes */}
              <Route path="/onboarding" element={<ProfessionalRoute><Onboarding /></ProfessionalRoute>} />
              <Route path="/checkout" element={<ProfessionalRoute><Checkout /></ProfessionalRoute>} />
              <Route path="/payment-success" element={<ProfessionalRoute><PaymentSuccess /></ProfessionalRoute>} />
              <Route path="/dashboard" element={<ProfessionalRoute><Dashboard /></ProfessionalRoute>} />
              <Route path="/agenda" element={<ProfessionalRoute><Agenda /></ProfessionalRoute>} />
              <Route path="/patients" element={<ProfessionalRoute><Patients /></ProfessionalRoute>} />
              <Route path="/telehealth" element={<ProfessionalRoute><Telehealth /></ProfessionalRoute>} />
              <Route path="/professionals" element={<ProfessionalRoute><Professionals /></ProfessionalRoute>} />
              <Route path="/financial" element={<ProfessionalRoute><Financial /></ProfessionalRoute>} />
              <Route path="/accounting" element={<ProfessionalRoute><Accounting /></ProfessionalRoute>} />
              <Route path="/legal" element={<ProfessionalRoute><Legal /></ProfessionalRoute>} />
              <Route path="/profile" element={<ProfessionalRoute><Profile /></ProfessionalRoute>} />
              <Route path="/subscription" element={<ProfessionalRoute><Subscription /></ProfessionalRoute>} />
              <Route path="/admin" element={<ProfessionalRoute><AdminDashboard /></ProfessionalRoute>} />
              <Route path="/sucesso" element={<ProfessionalRoute><Sucesso /></ProfessionalRoute>} />

              {/* Patient-only routes */}
              <Route path="/patient-dashboard" element={<PatientRoute><PatientDashboard /></PatientRoute>} />
              <Route path="/patient-dashboard/consultas" element={<PatientRoute><PatientDashboard /></PatientRoute>} />
              <Route path="/patient-dashboard/perfil" element={<PatientRoute><PatientDashboard /></PatientRoute>} />

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
