import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Configure PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDF_DATA_KEY = "onlyfocus_pdf_base64"; // Storing base64 data for reliability

interface PDFViewerProps {
    onClose: () => void;
}

const PDFViewer = ({ onClose }: PDFViewerProps) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfData, setPdfData] = useState<string | null>(localStorage.getItem(PDF_DATA_KEY));
    const [scale, setScale] = useState(1.0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Dynamic Width Calculation ---
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width } = entries[0].contentRect;
                setContainerWidth(width);
            }
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
        toast.success(`PDF loaded successfully! ${numPages} pages found.`);
    };

    const onDocumentLoadError = (error: Error) => {
        console.error("PDF Load Error:", error);
        toast.error(`Failed to load PDF: ${error.message}. The file might be corrupted or unsupported.`);
        handleClearPdf(); // Clear the corrupted data
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error("Please select a valid PDF file.");
            return;
        }

        setIsLoadingFile(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            try {
                localStorage.setItem(PDF_DATA_KEY, dataUrl);
                setPdfData(dataUrl);
                toast.info("PDF ready to display.");
            } catch (error) {
                console.error("Local storage error:", error);
                toast.error("Failed to save PDF. It might be too large for your browser's storage.");
            } finally {
                setIsLoadingFile(false);
            }
        };
        reader.onerror = () => {
            toast.error("Failed to read the selected file.");
            setIsLoadingFile(false);
        };
        reader.readAsDataURL(file);
    };

    const handleClearPdf = () => {
        setPdfData(null);
        setNumPages(null);
        setPageNumber(1);
        localStorage.removeItem(PDF_DATA_KEY);
        toast.info("PDF cleared from viewer.");
    };

    const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
    const goToNextPage = () => setPageNumber(prev => Math.min(numPages || 1, prev + 1));
    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
    
    const pageRenderWidth = containerWidth > 0 ? containerWidth * scale : undefined;

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
                    disabled={isLoadingFile}
                >
                    {isLoadingFile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {pdfData ? "Change PDF" : "Load PDF"}
                </Button>
                
                {pdfData && numPages && (
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={zoomOut} disabled={scale <= 0.5}><ZoomOut className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={zoomIn} disabled={scale >= 3.0}><ZoomIn className="w-4 h-4" /></Button>
                        
                        <Button size="icon" variant="ghost" onClick={goToPrevPage} disabled={pageNumber <= 1}><ChevronLeft className="w-4 h-4" /></Button>
                        <span className="text-sm font-medium w-20 text-center">
                            Page {pageNumber} of {numPages}
                        </span>
                        <Button size="icon" variant="ghost" onClick={goToNextPage} disabled={pageNumber >= numPages}><ChevronRight className="w-4 h-4" /></Button>
                        
                        <Button size="icon" variant="destructive" onClick={handleClearPdf} title="Clear PDF">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div ref={containerRef} className="flex-1 overflow-auto flex justify-center items-start p-2 bg-card rounded-lg">
                {!pdfData ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <FileText className="w-10 h-10 mx-auto mb-3" />
                        <p>Load a PDF file from your device to view it here.</p>
                        <p className="text-xs mt-2">(All data is stored locally in your browser)</p>
                    </div>
                ) : (
                    <Document
                        file={pdfData}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={<div className="flex items-center gap-2 text-primary"><Loader2 className="w-5 h-5 animate-spin" /> Preparing Document...</div>}
                        className="w-full h-full flex justify-center"
                    >
                        {containerWidth > 0 && (
                            <Page 
                                pageNumber={pageNumber} 
                                width={pageRenderWidth}
                                renderAnnotationLayer={true} 
                                renderTextLayer={true}
                                renderMode="canvas" 
                                className="shadow-lg my-4"
                            />
                        )}
                    </Document>
                )}
            </div>
        </div>
    );
};

export default PDFViewer;