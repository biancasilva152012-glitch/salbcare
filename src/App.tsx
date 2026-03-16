import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNav from "@/components/BottomNav";
import CookieConsent from "./components/CookieConsent";
import PageSkeleton from "@/components/PageSkeleton";
import PageContainer from "@/components/PageContainer";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 min default
      gcTime: 10 * 60 * 1000,   // 10 min garbage collection
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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
              <Route path="/telehealth" element={<ProtectedRoute><Telehealth /></ProtectedRoute>} />
              <Route path="/professionals" element={<ProtectedRoute><Professionals /></ProtectedRoute>} />
              <Route path="/financial" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
              <Route path="/accounting" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
              <Route path="/legal" element={<ProtectedRoute><Legal /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/booking" element={<PatientBooking />} />
              <Route path="/sala" element={<PatientRoom />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/como-funciona" element={<HowItWorks />} />
              <Route path="/test-pdf" element={<TestPrescriptionPdf />} />
              <Route path="/install" element={<Install />} />
              <Route path="/sucesso" element={<ProtectedRoute><Sucesso /></ProtectedRoute>} />
              <Route path="/cancelado" element={<Cancelado />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <BottomNav />
          <CookieConsent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
