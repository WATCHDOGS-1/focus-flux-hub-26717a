import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import VideoGrid from "@/components/VideoGrid";
import TaskList from "@/components/TaskList";
import NotesAndMediaPanel from "@/components/NotesAndMediaPanel";
import AICoachPanel from "@/components/AICoachPanel";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LayoutGrid, Terminal, Activity } from "lucide-react";
import { useStudy } from "@/context/StudyContext";

const WarRoom = () => {
    const { userId } = useAuth();
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { focusTag } = useStudy();

    return (
        <div className="h-screen w-screen flex flex-col bg-[#0B0E11] text-[#E1E1E1] font-sans">
            {/* Header / HUD */}
            <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-[#0F172A]/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary">
                        <Terminal className="w-4 h-4" /> CMD_CENTER://{focusTag.replace(/\s+/g, '_').toUpperCase()}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-xs h-8">
                        <Home className="w-3 h-3 mr-2" /> HQ
                    </Button>
                </div>
            </header>

            {/* Main Cockpit */}
            <main className="flex-1 overflow-hidden">
                <PanelGroup direction="horizontal">
                    {/* Left: Collective Visuals (30%) */}
                    <Panel defaultSize={30} minSize={20}>
                        <div className="h-full p-2 border-r border-border">
                            <VideoGrid userId={userId!} roomId={roomId || "default"} />
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

                    {/* Middle: War Room Notes (45%) */}
                    <Panel defaultSize={45} minSize={30}>
                        <div className="h-full p-2">
                            <NotesAndMediaPanel />
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

                    {/* Right: Tactical Sidebar (25%) */}
                    <Panel defaultSize={25} minSize={20}>
                        <PanelGroup direction="vertical">
                            <Panel defaultSize={60}>
                                <div className="h-full p-2 border-b border-border">
                                    <TaskList />
                                </div>
                            </Panel>
                            <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />
                            <Panel defaultSize={40}>
                                <div className="h-full p-2">
                                    <AICoachPanel />
                                </div>
                            </Panel>
                        </PanelGroup>
                    </Panel>
                </PanelGroup>
            </main>
        </div>
    );
};

export default WarRoom;