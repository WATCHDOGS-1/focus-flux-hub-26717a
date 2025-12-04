// A simple in-memory store for the currently loaded PDF file.
// This allows other components like the AI Coach to access it without prop drilling.

interface PdfStore {
  currentPdfFile: File | null;
}

const pdfStore: PdfStore = {
  currentPdfFile: null,
};

export const setCurrentPdfFile = (file: File | null) => {
  pdfStore.currentPdfFile = file;
};

export const getCurrentPdfFile = (): File | null => {
  return pdfStore.currentPdfFile;
};