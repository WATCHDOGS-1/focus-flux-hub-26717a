import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotebookText, FileText } from "lucide-react";
import NotesWorkspace from "./NotesWorkspace";
import PDFViewer from "./PDFViewer";
import TaskList from "./TaskList";

const NotesAndMediaPanel = () => {
  return (
    <div className="h-full w-full">
      <PanelGroup direction="horizontal" className="h-full">
        
        {/* Notes/PDF/Media Workspace (70%) */}
        <Panel defaultSize={70} minSize={30}>
          <Tabs defaultValue="notes" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 h-10 flex-shrink-0">
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <NotebookText className="w-4 h-4" /> Notes
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex items-center gap-2">
                <FileText className="w-4 h-4" /> PDF Viewer
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 min-h-0">
                <TabsContent value="notes" className="h-full mt-0">
                    <NotesWorkspace />
                </TabsContent>
                <TabsContent value="pdf" className="h-full mt-0">
                    {/* PDFViewer no longer needs onClose since the parent panel handles closing */}
                    <PDFViewer onClose={() => {}} /> 
                </TabsContent>
            </div>
          </Tabs>
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