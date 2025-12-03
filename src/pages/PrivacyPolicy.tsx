import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="dopamine-click">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-6 text-foreground">
        <p className="text-lg font-semibold text-primary">
          Effective Date: January 1, 2025
        </p>

        <p>
          Your privacy is important to us. This Privacy Policy explains how OnlyFocus collects, uses, and protects your personal information.
        </p>

        <h2 className="2xl font-bold mt-6">1. Information We Collect</h2>
        <p>
          We collect information necessary to provide and improve the service:
        </p>
        <ul>
          <li>**Account Data:** User ID, username, email (via Supabase/OAuth providers).</li>
          <li>**Focus Data:** Session start/end times, duration, focus tags, and gamification stats (XP, streaks).</li>
          <li>**Local Data:** Notes, To-Do lists, and the Gemini API key are stored exclusively in your browser's local storage and are **not** transmitted to our servers.</li>
        </ul>

        <h2 className="2xl font-bold mt-6">2. AI Coach Data Handling (Gemini API)</h2>
        <p>
          The AI Coach feature uses the Google Gemini API. When you interact with the AI Coach:
        </p>
        <ul>
          <li>Your messages, attached files, and injected context (stats, notes summary) are sent to the Google Gemini API for processing.</li>
          <li>Your Gemini API key is stored **only** locally in your browser and is used directly for API calls; **it is never sent to OnlyFocus servers.**</li>
          <li>OnlyFocus does not log or store the content of your AI conversations.</li>
        </ul>

        <h2 className="2xl font-bold mt-6">3. How We Use Your Information</h2>
        <p>
          We use your data to:
        </p>
        <ul>
          <li>Operate and maintain the service (e.g., running the timer, saving sessions).</li>
          <li>Provide social features (e.g., displaying your username and stats to friends/peers).</li>
          <li>Improve our gamification features and provide rule-based coaching.</li>
        </ul>

        <h2 className="2xl font-bold mt-6">4. Video and Audio Data (WebRTC)</h2>
        <p>
          **OnlyFocus does not store, record, or process your video or audio streams.** All video and audio communication within the focus rooms is handled via WebRTC, which establishes a direct, peer-to-peer connection between participants. Our servers are only used for signaling (setting up the connection).
        </p>

        <h2 className="2xl font-bold mt-6">5. Data Sharing and Disclosure</h2>
        <p>
          We do not sell your personal data. We may share data with third-party service providers (like Supabase for database hosting) only as necessary to operate the service.
        </p>

        <h2 className="2xl font-bold mt-6">6. Changes to this Policy</h2>
        <p>
          We may update this policy from time to time. We will notify you of any significant changes by posting the new policy on this page.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;