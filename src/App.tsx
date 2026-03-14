import { lazy, Suspense } from "react";
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

// Eager: splash, login, register (entry points)
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Lazy: all other pages
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Patients = lazy(() => import("./pages/Patients"));
const Telehealth = lazy(() => import("./pages/Telehealth"));
const Professionals = lazy(() => import("./pages/Professionals"));
const Financial = lazy(() => import("./pages/Financial"));
const Accounting = lazy(() => import("./pages/Accounting"));
const Legal = lazy(() => import("./pages/Legal"));
const Profile = lazy(() => import("./pages/Profile"));
const Subscription = lazy(() => import("./pages/Subscription"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PatientBooking = lazy(() => import("./pages/PatientBooking"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Maintenance = lazy(() => import("./pages/Maintenance"));

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
              <Route path="/" element={<Splash />} />
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
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/maintenance" element={<Maintenance />} />
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
