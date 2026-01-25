import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { NotebookText, Info } from "lucide-react";

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

  // Expanded toolbar to support more block-like features (headers, lists, indentation, code blocks)
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  // Injecting global styles to theme the Quill editor
  const quillStyles = `
    .ql-toolbar.ql-snow {
      border-top-left-radius: var(--radius);
      border-top-right-radius: var(--radius);
      border-color: hsl(var(--border));
      background-color: hsl(var(--card));
    }
    .ql-container.ql-snow {
      border-bottom-left-radius: var(--radius);
      border-bottom-right-radius: var(--radius);
      border-color: hsl(var(--border));
      background-color: hsl(var(--background));
      flex-grow: 1;
      overflow-y: auto;
    }
    .ql-editor {
      min-height: 100%;
      color: hsl(var(--foreground));
    }
    .ql-snow .ql-stroke {
      stroke: hsl(var(--foreground));
    }
    .ql-snow .ql-fill {
      fill: hsl(var(--foreground));
    }
    .ql-snow .ql-picker-label {
      color: hsl(var(--foreground));
    }
    .ql-snow .ql-picker-options {
      background-color: hsl(var(--popover));
      border-color: hsl(var(--border));
    }
  `;

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-3 h-full">
      {/* Style injection for Quill theming */}
      <style dangerouslySetInnerHTML={{ __html: quillStyles }} />

      <h4 className="text-lg font-semibold flex items-center justify-between border-b border-border pb-2">
        <span className="flex items-center gap-2 text-primary">
          <NotebookText className="w-5 h-5" />
          Local Study Notes
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="w-3 h-3" />
          Use indentation (Tab) for nested blocks.
        </span>
      </h4>
      
      <div className="flex-1 min-h-0 flex flex-col">
        <ReactQuill 
          theme="snow" 
          value={content} 
          onChange={handleChange} 
          modules={modules}
          placeholder="Start typing your notes here. Use lists and indentation (Tab key) to create nested blocks and toggle lists. This content is saved locally on your device."
          className="flex-1 flex flex-col"
        />
      </div>
    </div>
  );
};

export default NotesWorkspace;