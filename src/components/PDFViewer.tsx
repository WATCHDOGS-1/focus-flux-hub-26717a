import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { setCurrentPdfFile } from "@/utils/pdf-store";

// Configure PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Removed PDFViewerProps interface

const PDFViewer = () => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null); // State for Base64 data URL
    const [scale, setScale] = useState(1.0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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
        handleClearPdf();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error("Please select a valid PDF file.");
            return;
        }

        // Update the shared store for the AI Coach
        setCurrentPdfFile(file);
        
        // Convert file to Base64 Data URL for stable rendering
        setIsLoadingFile(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setPdfDataUrl(dataUrl);
            setIsLoadingFile(false);
        };
        reader.onerror = () => {
            toast.error("Failed to read the selected file.");
            setIsLoadingFile(false);
        };
        reader.readAsDataURL(file);
    };

    const handleClearPdf = () => {
        setPdfDataUrl(null);
        setCurrentPdfFile(null);
        setNumPages(null);
        setPageNumber(1);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast.info("PDF cleared from viewer.");
    };

    const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
    const goToNextPage = () => setPageNumber(prev => Math.min(numPages || 1, prev + 1));
    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
    
    // Pass width only if containerWidth > 0, otherwise pass undefined to let react-pdf use default sizing
    const pageRenderWidth = containerWidth > 0 ? containerWidth * scale : undefined;

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                <h4 className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <FileText className="w-5 h-5" />
                    Local PDF Viewer
                </h4>
                {/* Removed Close PDF button */}
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
                    {pdfDataUrl ? "Change PDF" : "Load PDF"}
                </Button>
                
                {pdfDataUrl && numPages && (
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
                {!pdfDataUrl ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <FileText className="w-10 h-10 mx-auto mb-3" />
                        <p>Load a PDF file from your device to view it here.</p>
                        <p className="text-xs mt-2">(The file is processed locally and not uploaded)</p>
                    </div>
                ) : (
                    <Document
                        file={pdfDataUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={<div className="flex items-center gap-2 text-primary"><Loader2 className="w-5 h-5 animate-spin" /> Preparing Document...</div>}
                        className="w-full h-full flex justify-center"
                    >
                        <Page 
                            pageNumber={pageNumber} 
                            width={pageRenderWidth} // Pass undefined if containerWidth is 0
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