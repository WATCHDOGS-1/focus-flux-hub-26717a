import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image, Send, Edit, Clock, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImageToCloudinary } from "@/utils/cloudinary"; // Reverted import
import type { Database } from "@/integrations/supabase/types";

type FeedItem = Database["public"]["Tables"]["feed_items"]["Row"];

interface PostData {
    caption: string;
    imageUrl: string | null;
}

interface CreatePostModalProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onPostCreated: () => void;
    editingPost?: FeedItem | null;
}

const COOLDOWN_MINUTES = 30;
const COOLDOWN_KEY = "last_post_time";

const CreatePostModal = ({ userId, isOpen, onClose, onPostCreated, editingPost }: CreatePostModalProps) => {
    const [caption, setCaption] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [lastPostTime, setLastPostTime] = useState<number>(0);

    const isEditing = !!editingPost;

    useEffect(() => {
        // Load cooldown time from local storage
        const storedTime = localStorage.getItem(COOLDOWN_KEY);
        if (storedTime) {
            setLastPostTime(parseInt(storedTime, 10));
        }
    }, []);

    useEffect(() => {
        if (isEditing && editingPost) {
            const data = editingPost.data as PostData;
            setCaption(data?.caption || "");
            setPreviewUrl(data?.imageUrl || null);
            setImageFile(null);
        } else {
            setCaption("");
            setPreviewUrl(null);
            setImageFile(null);
        }
    }, [editingPost, isEditing]);

    const timeRemaining = useMemo(() => {
        if (isEditing) return 0;
        const elapsed = Date.now() - lastPostTime;
        const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
        return Math.max(0, cooldownMs - elapsed);
    }, [lastPostTime, isEditing]);

    const isCooldownActive = timeRemaining > 0;

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!caption.trim() && !imageFile && !previewUrl) {
            toast.error("Post must contain a caption or an image.");
            return;
        }
        if (!isEditing && isCooldownActive) {
            toast.warning(`Post cooldown active. Try again in ${formatTime(timeRemaining)}.`);
            return;
        }

        setIsUploading(true);
        let finalImageUrl = previewUrl;

        try {
            if (imageFile) {
                // 1. Upload image to Cloudinary
                finalImageUrl = await uploadImageToCloudinary(imageFile);
            }

            const postData: PostData = {
                caption: caption.trim(),
                imageUrl: finalImageUrl,
            };

            if (isEditing && editingPost) {
                // 2. Update existing post
                const { error } = await supabase
                    .from("feed_items")
                    .update({ data: postData })
                    .eq("id", editingPost.id);

                if (error) throw error;
                toast.success("Post updated successfully!");
            } else {
                // 2. Create new post
                const { error } = await supabase
                    .from("feed_items")
                    .insert({
                        user_id: userId,
                        type: 'user_post',
                        data: postData,
                    });

                if (error) throw error;
                
                // 3. Set cooldown
                const now = Date.now();
                localStorage.setItem(COOLDOWN_KEY, now.toString());
                setLastPostTime(now);
                toast.success("Post created successfully!");
            }

            onPostCreated();
            onClose();
        } catch (error: any) {
            console.error("Post submission failed:", error);
            toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} post.`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass-card">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditing ? <Edit className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                        {isEditing ? "Edit Focus Post" : "Create New Focus Post"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea
                        placeholder="What are you focusing on today? Share your progress or motivation..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={4}
                        disabled={isUploading}
                    />

                    {previewUrl && (
                        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                            <img src={previewUrl} alt="Image Preview" className="w-full h-full object-cover" />
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-2 right-2"
                                onClick={() => { setPreviewUrl(null); setImageFile(null); }}
                                disabled={isUploading}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isUploading}
                        />
                        <label htmlFor="image-upload" className="flex-1">
                            <Button 
                                variant="outline" 
                                className="w-full flex items-center gap-2"
                                disabled={isUploading}
                            >
                                <Image className="w-4 h-4" />
                                {imageFile ? "Change Image" : "Add Image"}
                            </Button>
                        </label>
                        
                        <Button 
                            onClick={handleSubmit} 
                            disabled={isUploading || (!isEditing && isCooldownActive)}
                            className="dopamine-click"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : isEditing ? (
                                <Edit className="w-4 h-4 mr-2" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            {isEditing ? "Save Changes" : "Post to Feed"}
                        </Button>
                    </div>
                    
                    {!isEditing && isCooldownActive && (
                        <div className="text-sm text-warning flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            Cooldown: {formatTime(timeRemaining)} remaining
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreatePostModal;