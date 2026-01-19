import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { KnowledgeProvider } from "@/hooks/use-knowledge";
import { StudyProvider } from "@/context/StudyContext";
import MarketingLanding from "./pages/MarketingLanding";
import SocialDashboard from "./pages/SocialDashboard";
import ProductivityDashboard from "./pages/ProductivityDashboard";
import Auth from "./pages/Auth";
import ExploreRooms from "./pages/ExploreRooms";
import FocusRoom from "./pages/FocusRoom";
import WarRoom from "./pages/WarRoom"; // NEW
import CircleDetail from "./pages/CircleDetail";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotesBase from "./pages/NotesBase";
import NotFound from "./pages/NotFound";
import AuthCallback from "./components/AuthCallback";
import ZenMode from "./pages/ZenMode";
import OnboardingTour from "./components/OnboardingTour";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StudyProvider>
            <KnowledgeProvider>
              <OnboardingTour />
              <Routes>
                <Route path="/" element={<SocialDashboard />} />
                <Route path="/landing" element={<MarketingLanding />} />
                <Route path="/productivity" element={<ProductivityDashboard />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/explore" element={<ExploreRooms />} />
                <Route path="/circle/:circleId" element={<CircleDetail />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/notes" element={<NotesBase />} />
                <Route path="/focus-room/:roomId" element={<WarRoom />} /> {/* Pivoted to WarRoom */}
                <Route path="/zen-mode" element={<ZenMode />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </KnowledgeProvider>
          </StudyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;