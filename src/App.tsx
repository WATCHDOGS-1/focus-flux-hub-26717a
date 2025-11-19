import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import ExploreRooms from "./pages/ExploreRooms"; // Import new page
import FocusRoom from "./pages/FocusRoom";
import NotFound from "./pages/NotFound";
import AuthCallback from "./components/AuthCallback";
import SocialDashboard from "./pages/SocialDashboard";
import SquadsPage from "./pages/SquadsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="dark min-h-screen bg-background text-foreground bg-noise font-sans selection:bg-primary selection:text-primary-foreground">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/dashboard" element={<SocialDashboard />} />
              <Route path="/squads" element={<SquadsPage />} />
              <Route path="/explore" element={<ExploreRooms />} /> {/* New Explore Route */}
              <Route path="/focus-room/:roomId" element={<FocusRoom />} /> {/* Dynamic Room Route */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;