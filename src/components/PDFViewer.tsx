import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Configure PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDF_URL_KEY = "onlyfocus_pdf_url";
const MAX_PAGE_WIDTH = 800; // Max width for the page rendering

interface PDFViewerProps {
    onClose: () => void;
}

const PDFViewer = ({ onClose }: PDFViewerProps) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfUrl, setPdfUrl] = useState<string | null>(localStorage.getItem(PDF_URL_KEY));
    const [scale, setScale] = useState(1.0);
    const [containerWidth, setContainerWidth] = useState(MAX_PAGE_WIDTH);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Dynamic Width Calculation ---
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(entries => {
            const { width } = entries[0].contentRect;
            // Set the container width, capped at MAX_PAGE_WIDTH for performance
            setContainerWidth(Math.min(width, MAX_PAGE_WIDTH));
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);
    // --- End Dynamic Width Calculation ---

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
        toast.success(`PDF loaded successfully! ${numPages} pages found.`);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            // Revoke previous URL if it exists to prevent memory leaks
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
            const url = URL.createObjectURL(file);
            setPdfUrl(url);
            localStorage.setItem(PDF_URL_KEY, url);
            toast.info("Loading PDF...");
        } else {
            toast.error("Please select a valid PDF file.");
        }
    };

    const handleClearPdf = () => {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
        setPdfUrl(null);
        setNumPages(null);
        setPageNumber(1);
        localStorage.removeItem(PDF_URL_KEY);
        toast.info("PDF cleared from viewer.");
    };

    const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
    const goToNextPage = () => setPageNumber(prev => Math.min(numPages || 1, prev + 1));
    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
    
    // Calculate the width to pass to the Page component
    const pageRenderWidth = containerWidth * scale;

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                <h4 className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <FileText className="w-5 h-5" />
                    Local PDF Viewer
                </h4>
                <Button variant="ghost" size="sm" onClick={onClose} className="text-sm">
                    <X className="w-4 h-4 mr-1" /> Close PDF
                </Button>
            </div>

            <div className="flex-shrink-0 flex items-center justify-between p-2 bg-secondary/50 rounded-lg mb-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline" 
                    size="sm"
                    className="dopamine-click"
                >
                    {pdfUrl ? "Change PDF" : "Load PDF"}
                </Button>
                
                {pdfUrl && (
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={zoomOut} disabled={scale <= 0.5}><ZoomOut className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={zoomIn} disabled={scale >= 3.0}><ZoomIn className="w-4 h-4" /></Button>
                        
                        <Button size="icon" variant="ghost" onClick={goToPrevPage} disabled={pageNumber <= 1}><ChevronLeft className="w-4 h-4" /></Button>
                        <span className="text-sm font-medium w-20 text-center">
                            Page {pageNumber} of {numPages || '?'}
                        </span>
                        <Button size="icon" variant="ghost" onClick={goToNextPage} disabled={pageNumber >= (numPages || 1)}><ChevronRight className="w-4 h-4" /></Button>
                        
                        <Button size="icon" variant="destructive" onClick={handleClearPdf} title="Clear PDF">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* PDF Container: Use ref to measure width for dynamic page rendering */}
            <div ref={containerRef} className="flex-1 overflow-y-auto flex justify-center items-start p-2 bg-card rounded-lg">
                {!pdfUrl ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <FileText className="w-10 h-10 mx-auto mb-3" />
                        <p>Load a PDF file from your device to view it here.</p>
                    </div>
                ) : (
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="flex items-center gap-2 text-primary"><Loader2 className="w-5 h-5 animate-spin" /> Loading Document...</div>}
                        error={<div className="text-destructive">Failed to load PDF.</div>}
                        className="w-full h-full overflow-auto flex justify-center"
                    >
                        <Page 
                            pageNumber={pageNumber} 
                            width={pageRenderWidth} // Use calculated width
                            renderAnnotationLayer={true} 
                            renderTextLayer={true}
                            renderMode="canvas" 
                            className="shadow-lg my-4"
                        />
                    </Document>
                )}
            </div>
        </div>
    );
};

export default PDFViewer;