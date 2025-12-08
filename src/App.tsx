import { Routes, Route } from "react-router-dom";

// Pages
import Landing from "@/pages/MarketingLanding";
import Auth from "@/pages/Auth";
import AuthCallback from "@/components/AuthCallback";
import FocusRoom from "@/pages/FocusRoom";
import ZenMode from "@/pages/ZenMode";
import ExploreRooms from "@/pages/ExploreRooms";
import SocialDashboard from "@/pages/SocialDashboard";
import ProductivityDashboard from "@/pages/ProductivityDashboard";
import NotesBase from "@/pages/NotesBase";
import CircleDetail from "@/pages/CircleDetail";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import NotFound from "@/pages/NotFound";

const App = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/explore" element={<ExploreRooms />} />
    <Route path="/focus-room/:roomId" element={<FocusRoom />} />
    <Route path="/zen-mode" element={<ZenMode />} />
    <Route path="/social" element={<SocialDashboard />} />
    <Route path="/productivity" element={<ProductivityDashboard />} />
    <Route path="/notes" element={<NotesBase />} />
    <Route path="/circle/:circleId" element={<CircleDetail />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<TermsOfService />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;