import { useState } from "react";
import SocialListPanel from "./SocialListPanel";
import DMConversation from "./DMConversation";

interface SocialSidebarProps {
  userId: string;
  onProfileClick: (userId: string) => void; // New prop
}

const SocialSidebar = ({ userId, onProfileClick }: SocialSidebarProps) => {
  const [activeConversation, setActiveConversation] = useState<{
    id: string;
    targetUsername: string;
    targetUserId: string;
  } | null>(null);

  const handleSelectConversation = (
    conversationId: string,
    targetUsername: string,
    targetUserId: string
  ) => {
    setActiveConversation({ id: conversationId, targetUsername, targetUserId });
  };

  const handleBack = () => {
    setActiveConversation(null);
  };

  return (
    <div className="h-full flex flex-col">
      {activeConversation ? (
        <DMConversation
          conversationId={activeConversation.id}
          targetUsername={activeConversation.targetUsername}
          targetUserId={activeConversation.targetUserId}
          currentUserId={userId}
          onBack={handleBack}
        />
      ) : (
        <SocialListPanel
          currentUserId={userId}
          onSelectConversation={handleSelectConversation}
          onProfileClick={onProfileClick} // Pass the handler
        />
      )}
    </div>
  );
};

export default SocialSidebar;