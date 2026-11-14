import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import SMTPSettings from "./pages/dashboard/SMTPSettings";
import Templates from "./pages/dashboard/Templates";
import Scheduled from "./pages/dashboard/Scheduled";
import Logs from "./pages/dashboard/Logs";
import Companies from "./pages/dashboard/Companies";
import HrLists from "./pages/dashboard/HrLists";
import Settings from "./pages/dashboard/Settings";

import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MaintenanceGuard>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Dashboard Routes - Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="smtp" element={<SMTPSettings />} />
                <Route path="templates" element={<Templates />} />
                <Route path="scheduled" element={<Scheduled />} />
                <Route path="companies" element={<Companies />} />
                <Route path="hr-lists" element={<HrLists />} />
                <Route path="logs" element={<Logs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </MaintenanceGuard>
  </QueryClientProvider>
);

export default App;
