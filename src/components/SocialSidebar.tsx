import { useState } from "react";
import DMListPanel from "./DMListPanel";
import DMConversation from "./DMConversation";

interface SocialSidebarProps {
  userId: string;
}

const SocialSidebar = ({ userId }: SocialSidebarProps) => {
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
        <DMListPanel
          currentUserId={userId}
          onSelectConversation={handleSelectConversation}
        />
      )}
    </div>
  );
};

export default SocialSidebar;