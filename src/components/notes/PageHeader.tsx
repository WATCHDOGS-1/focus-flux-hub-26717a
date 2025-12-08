import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, Smile, Trash2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PageHeaderProps {
    title: string;
    onTitleChange: (title: string) => void;
    icon: string | null;
    onIconChange: (icon: string | null) => void;
    coverImageUrl: string | null;
    onCoverImageChange: (file: File | null) => Promise<void>;
    isSaving: boolean;
}

const PageHeader = ({ title, onTitleChange, icon, onIconChange, coverImageUrl, onCoverImageChange, isSaving }: PageHeaderProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const handleDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setIsUploading(true);
            try {
                await onCoverImageChange(acceptedFiles[0]);
            } catch (e) {
                toast.error("Failed to upload cover image.");
            } finally {
                setIsUploading(false);
            }
        }
    }, [onCoverImageChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
    });

    const handleRemoveCover = async () => {
        setIsUploading(true);
        try {
            await onCoverImageChange(null);
            toast.info("Cover image removed.");
        } catch (e) {
            toast.error("Failed to remove cover image.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        onIconChange(emojiData.emoji);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Cover Image Area */}
            <div 
                {...getRootProps()}
                className={cn(
                    "w-full h-[30vh] min-h-48 bg-secondary/50 transition-all duration-300 group",
                    coverImageUrl ? "bg-cover bg-center" : "flex items-center justify-center border-b border-border/50",
                    isDragActive && "ring-4 ring-accent/50 border-accent/50"
                )}
                style={{ backgroundImage: coverImageUrl ? `url(${coverImageUrl})` : 'none' }}
            >
                <input {...getInputProps()} />
                
                {/* Cover Image Overlay/Buttons */}
                <div className={cn(
                    "absolute inset-0 flex items-end justify-end p-4 transition-opacity duration-300",
                    coverImageUrl ? "bg-black/20" : "bg-transparent",
                    isHovering || isDragActive ? "opacity-100" : "opacity-0"
                )}>
                    {isUploading ? (
                        <Button variant="secondary" disabled className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                        </Button>
                    ) : coverImageUrl ? (
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={handleRemoveCover} className="dopamine-click">
                                <Trash2 className="w-4 h-4 mr-1" /> Remove Cover
                            </Button>
                            <Button variant="secondary" size="sm" className="dopamine-click">
                                <Upload className="w-4 h-4 mr-1" /> Change Cover
                            </Button>
                        </div>
                    ) : (
                        <Button variant="secondary" size="sm" className="dopamine-click">
                            <Image className="w-4 h-4 mr-1" /> Add Cover
                        </Button>
                    )}
                </div>
                
                {/* Drag Active State */}
                {isDragActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/50 text-white text-xl font-bold">
                        Drop image here to set as cover
                    </div>
                )}
            </div>

            {/* Icon and Title */}
            <div className="container mx-auto px-4 -mt-12 relative z-20">
                {/* Icon */}
                <Popover>
                    <PopoverTrigger asChild>
                        <div className={cn(
                            "w-24 h-24 rounded-xl bg-secondary/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-5xl cursor-pointer transition-all hover:scale-[1.05] dopamine-click",
                            !icon && "text-muted-foreground"
                        )}>
                            {icon || <Smile className="w-10 h-10" />}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 glass-card">
                        <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
                    </PopoverContent>
                </Popover>

                {/* Title Input */}
                <Input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="Untitled"
                    className="text-4xl font-bold bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 mt-4 h-auto p-0"
                    disabled={isSaving}
                />
            </div>
        </motion.div>
    );
};

export default PageHeader;