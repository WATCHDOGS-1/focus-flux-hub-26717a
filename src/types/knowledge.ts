import { PartialBlock } from "@blocknote/core";

export interface Document {
  id: string;
  title: string;
  content: PartialBlock[] | string; // BlockNote JSON (array) or Excalidraw JSON (string)
  type: 'text' | 'canvas';
  icon: string | null; // Added
  coverImageUrl: string | null; // Added
}

// Mock data for initial setup
export const MOCK_DOCUMENTS: Document[] = [
    { id: 'doc-1', title: 'Project Alpha Notes', content: [], type: 'text', icon: '📝', coverImageUrl: null },
    { id: 'doc-2', title: 'System Architecture Diagram', content: '{"elements":[]}', type: 'canvas', icon: '📐', coverImageUrl: null },
    { id: 'doc-3', title: 'Daily Journal Entry', content: [], type: 'text', icon: '📅', coverImageUrl: null },
];