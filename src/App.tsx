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
import ProfilePage from "./pages/Profile"; // Import new Profile page
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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/explore" element={<ExploreRooms />} /> {/* New Explore Route */}
            <Route path="/profile" element={<ProfilePage />} /> {/* New Profile Route */}
            <Route path="/focus-room/:roomId" element={<FocusRoom />} /> {/* Dynamic Room Route */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;