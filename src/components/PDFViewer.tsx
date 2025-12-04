import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { setCurrentPdfFile } from "@/utils/pdf-store";
import { uploadFileToSupabase, deleteFileFromSupabase } from "@/utils/supabase-storage";
import { useAuth } from "@/hooks/use-auth";

// Configure PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
    onClose: () => void; // New prop to handle panel closure
}

const PDFViewer = ({ onClose }: PDFViewerProps) => {
    const { userId } = useAuth();
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null); // Now stores the public Supabase URL
    const [scale, setScale] = useState(1.0);
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const uploadedFileUrlRef = useRef<string | null>(null); // Track URL for cleanup

    // Cleanup effect: Delete file from Supabase when component unmounts or pdfUrl changes to null
    useEffect(() => {
        return () => {
            if (uploadedFileUrlRef.current) {
                deleteFileFromSupabase(uploadedFileUrlRef.current);
                uploadedFileUrlRef.current = null;
            }
        };
    }, []);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
        setScale(1.0);
        toast.success(`PDF loaded successfully! ${numPages} pages found.`);
        setIsLoadingFile(false);
    };

    const onDocumentLoadError = (error: Error) => {
        console.error("PDF Load Error:", error);
        toast.error(`Failed to load PDF: ${error.message}. The file might be corrupted or unsupported.`);
        handleClearPdf();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !userId) return;

        if (file.type !== 'application/pdf') {
            toast.error("Please select a valid PDF file.");
            return;
        }

        // Clear any previous file first
        if (uploadedFileUrlRef.current) {
            await deleteFileFromSupabase(uploadedFileUrlRef.current);
            uploadedFileUrlRef.current = null;
        }

        setIsLoadingFile(true);
        toast.loading("Uploading PDF for viewing...", { id: 'pdf-upload' });

        try {
            const publicUrl = await uploadFileToSupabase(file, userId);
            
            // Update the shared store for the AI Coach
            setCurrentPdfFile(file);
            
            setPdfUrl(publicUrl);
            uploadedFileUrlRef.current = publicUrl;
            toast.success("PDF uploaded and ready to view.", { id: 'pdf-upload' });
        } catch (e: any) {
            toast.error(e.message || "Failed to upload PDF.", { id: 'pdf-upload' });
            setIsLoadingFile(false);
        }
    };

    const handleClearPdf = async () => {
        if (uploadedFileUrlRef.current) {
            await deleteFileFromSupabase(uploadedFileUrlRef.current);
            uploadedFileUrlRef.current = null;
        }
        setPdfUrl(null);
        setCurrentPdfFile(null);
        setNumPages(null);
        setPageNumber(1);
        setScale(1.0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast.info("PDF cleared and deleted from server.");
    };

    const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
    const goToNextPage = () => setPageNumber(prev => Math.min(numPages || 1, prev + 1));
    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
    
    // Determine the width based on the container size (fixed to 100% of parent)
    const containerWidth = containerRef.current?.clientWidth || 600; // Fallback width

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                <h4 className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <FileText className="w-5 h-5" />
                    Cloud PDF Viewer
                </h4>
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
                    {pdfUrl ? "Change PDF" : "Load PDF"}
                </Button>
                
                {pdfUrl && numPages && (
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
                {!pdfUrl ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <FileText className="w-10 h-10 mx-auto mb-3" />
                        <p>Load a PDF file from your device to view it here.</p>
                        <p className="text-xs mt-2">(File is temporarily stored on the server for viewing and deleted on clear/close.)</p>
                    </div>
                ) : (
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={<div className="flex items-center gap-2 text-primary"><Loader2 className="w-5 h-5 animate-spin" /> Preparing Document...</div>}
                        className="w-full h-full flex justify-center"
                        // We use a fixed width based on the container for stability
                        style={{ width: '100%', height: '100%' }} 
                    >
                        <Page 
                            pageNumber={pageNumber} 
                            scale={scale}
                            width={containerWidth * scale} // Use calculated width for scaling
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