import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import NotesWorkspace from "./NotesWorkspace";
import TaskList from "./TaskList";
import AICoachWorkspace from "./AICoachWorkspace";
import YouTubePanel from "./YouTubePanel"; // Use the consolidated YouTubePanel

const NotesAndTasksWorkspace = () => {
  return (
    <div className="h-full w-full">
      <PanelGroup direction="vertical" className="h-full">
        
        {/* Top Panel: Notes and Tasks (Resizable Horizontal Split) */}
        <Panel defaultSize={33} minSize={20}>
          <PanelGroup direction="horizontal" className="h-full">
            {/* Notes Workspace (70%) */}
            <Panel defaultSize={70} minSize={30}>
              <NotesWorkspace />
            </Panel>
            
            <PanelResizeHandle className="w-2 flex items-center justify-center bg-border/50 hover:bg-primary/50 transition-colors cursor-col-resize">
              <div className="w-1 h-10 bg-primary/50 rounded-full" />
            </PanelResizeHandle>
            
            {/* Task List (30%) */}
            <Panel defaultSize={30} minSize={20}>
              <TaskList />
            </Panel>
          </PanelGroup>
        </Panel>
        
        <PanelResizeHandle className="h-2 flex items-center justify-center bg-border/50 hover:bg-primary/50 transition-colors cursor-row-resize">
          <div className="h-1 w-10 bg-primary/50 rounded-full" />
        </PanelResizeHandle>
        
        {/* Middle Panel: AI Coach */}
        <Panel defaultSize={33} minSize={20}>
          <AICoachWorkspace />
        </Panel>
        
        <PanelResizeHandle className="h-2 flex items-center justify-center bg-border/50 hover:bg-primary/50 transition-colors cursor-row-resize">
          <div className="h-1 w-10 bg-primary/50 rounded-full" />
        </PanelResizeHandle>
        
        {/* Bottom Panel: YouTube Player */}
        <Panel defaultSize={34} minSize={20}>
          <YouTubePanel />
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default NotesAndTasksWorkspace;