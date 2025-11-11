import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { NotebookText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const LOCAL_STORAGE_KEY = "onlyfocus_notes_content";

const NotesWorkspace = () => {
  const [content, setContent] = useState("");

  // Load content from local storage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedContent) {
      setContent(savedContent);
    }
  }, []);

  // Save content to local storage on change
  const handleChange = (value: string) => {
    setContent(value);
    localStorage.setItem(LOCAL_STORAGE_KEY, value);
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ],
  };

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-3 h-[600px]">
      <h4 className="text-lg font-semibold flex items-center gap-2 text-primary">
        <NotebookText className="w-5 h-5" />
        Local Study Notes (Notion Lite)
      </h4>
      <ScrollArea className="flex-1 h-full">
        <div className="h-full pb-4">
          <ReactQuill 
            theme="snow" 
            value={content} 
            onChange={handleChange} 
            modules={modules}
            placeholder="Start typing your notes here. This content is saved locally on your device."
            className="h-full"
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export default NotesWorkspace;