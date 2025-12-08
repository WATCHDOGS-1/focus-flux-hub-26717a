import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { KnowledgeProvider } from "@/hooks/use-knowledge";
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
import { AudioProvider, useAudioFeedback } from "./hooks/useAudioFeedback";
import OnboardingTour from "./components/OnboardingTour";

const queryClient = new QueryClient();

// Component to handle global click audio
const GlobalAudioWrapper = ({ children }: { children: React.ReactNode }) => {
    const { play } = useAudioFeedback();

    const handleClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        // Check if the clicked element or its parent has the dopamine-click class
        if (target.closest('.dopamine-click')) {
            play('click');
        }
    };

    return <div onClick={handleClick}>{children}</div>;
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AudioProvider>
            <GlobalAudioWrapper>
              <KnowledgeProvider>
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
              </KnowledgeProvider>
            </GlobalAudioWrapper>
          </AudioProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;