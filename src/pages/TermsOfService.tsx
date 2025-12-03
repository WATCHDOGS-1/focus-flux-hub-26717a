import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="dopamine-click">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-4xl font-bold">Terms of Service</h1>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-6 text-foreground">
        <p className="text-lg font-semibold text-primary">
          Effective Date: December 10, 2024
        </p>

        <p>
          Welcome to OnlyFocus. By accessing or using our service, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
        </p>

        <h2 className="text-2xl font-bold mt-6">1. Acceptance of Terms</h2>
        <p>
          By creating an account or using the OnlyFocus platform, you confirm that you are at least 18 years old or have reached the age of majority in your jurisdiction, and you agree to these Terms. If you do not agree, you must not use the service.
        </p>

        <h2 className="text-2xl font-bold mt-6">2. Community Guidelines and Moderation</h2>
        <p>
          OnlyFocus is dedicated to providing a safe and productive environment. You agree not to post, stream, or transmit any content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or racially/ethnically objectionable.
        </p>
        <h3 className="text-xl font-bold mt-4">2.1 Reporting and Bans</h3>
        <p>
          Users may report video feeds, chat messages, or usernames that violate these guidelines. Our automated moderation system tracks reports. If a user receives more than three (3) valid reports within a fifteen (15) minute period, they may be subject to an immediate temporary ban of seven (7) days. Repeated violations will result in permanent account termination. All moderation decisions are final.
        </p>
        <h3 className="text-xl font-bold mt-4">2.2 Video Streams</h3>
        <p>
          Video streams are peer-to-peer (WebRTC) and are not recorded by OnlyFocus. However, you are responsible for the content you broadcast. Streams must be used for silent co-working purposes only.
        </p>
        <h3 className="text-xl font-bold mt-4">2.3 AI Coach Usage</h3>
        <p>
          The AI Coach feature uses the Google Gemini API. You are responsible for providing your own API key, which is stored locally in your browser. You agree not to use the AI Coach to generate illegal, harmful, or inappropriate content. OnlyFocus does not store or review the content of your AI conversations unless required for moderation purposes.
        </p>

        <h2 className="text-2xl font-bold mt-6">3. Intellectual Property</h2>
        <p>
          All content provided by OnlyFocus (excluding user-generated content) is the property of OnlyFocus and protected by copyright laws. You retain all rights to the content you create and share on the platform (e.g., notes, tasks, posts).
        </p>

        <h2 className="text-2xl font-bold mt-6">4. Limitation of Liability</h2>
        <p>
          OnlyFocus is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to loss of data, loss of productivity, or interruptions in service. You use the service at your own risk.
        </p>
        
        <h2 className="text-2xl font-bold mt-6">5. Governing Law</h2>
        <p>
          These Terms shall be governed by the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;