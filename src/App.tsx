import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { KnowledgeProvider } from "@/hooks/use-knowledge";
import { TaskProvider } from "@/hooks/use-tasks";
import MarketingLanding from "./pages/MarketingLanding";
import MainDashboard from "./pages/MainDashboard";
import ProductivityDashboard from "./pages/ProductivityDashboard";
import Auth from "./pages/Auth";
import ExploreRooms from "./pages/ExploreRooms";
import FocusRoom from "./pages/FocusRoom";
import SocialDashboard from "./pages/SocialDashboard";
import CircleDetail from "./pages/CircleDetail";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotesBase from "./pages/NotesBase";
import NotFound from "./pages/NotFound";
import AuthCallback from "./components/AuthCallback";
import ZenMode from "./pages/ZenMode";
import OnboardingTour from "./components/OnboardingTour";
import ErrorBoundary from "./components/ErrorBoundary"; // Import ErrorBoundary

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <KnowledgeProvider>
              <TaskProvider>
                <OnboardingTour />
                <Routes>
                  <Route path="/" element={<MainDashboard />} />
                  <Route path="/landing" element={<MarketingLanding />} />
                  <Route path="/productivity" element={<ProductivityDashboard />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/explore" element={<ExploreRooms />} />
                  <Route path="/social" element={<SocialDashboard />} />
                  <Route path="/circle/:circleId" element={<CircleDetail />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/notes" element={<NotesBase />} />
                  <Route path="/focus-room/:roomId" element={<FocusRoom />} />
                  <Route path="/zen-mode" element={<ZenMode />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TaskProvider>
            </KnowledgeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;