import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import NotesWorkspace from "./NotesWorkspace";
import TaskList from "./TaskList";

const NotesAndMediaPanel = () => {
  return (
    <div className="h-full w-full">
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
    </div>
  );
};

export default NotesAndMediaPanel;