import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { KnowledgeProvider } from "@/hooks/use-knowledge";
import Landing from "./pages/Landing";
import ProductivityDashboard from "./pages/ProductivityDashboard";
import Auth from "./pages/Auth";
import ExploreRooms from "./pages/ExploreRooms";
import FocusRoom from "./pages/FocusRoom";
import SocialDashboard from "./pages/SocialDashboard";
import CircleDetail from "./pages/CircleDetail";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import KnowledgeBase from "./pages/KnowledgeBase";
import NotFound from "./pages/NotFound";
import AuthCallback from "./components/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <KnowledgeProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/productivity" element={<ProductivityDashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/explore" element={<ExploreRooms />} />
              <Route path="/social" element={<SocialDashboard />} />
              <Route path="/circle/:circleId" element={<CircleDetail />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route path="/focus-room/:roomId" element={<FocusRoom />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </KnowledgeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;