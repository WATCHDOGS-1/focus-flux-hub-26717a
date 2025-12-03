import AICoachPanel from "./AICoachPanel";
import { Card, CardContent } from "@/components/ui/card";

const AICoachWorkspace = () => {
  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-3 h-full">
      <AICoachPanel />
    </div>
  );
};

export default AICoachWorkspace;