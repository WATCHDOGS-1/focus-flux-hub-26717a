import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Custom hook for uploading files to Supabase Storage.
 * @param bucketName The name of the storage bucket (e.g., 'avatars', 'feed_images').
 */
export function useImageUpload(bucketName: string) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File, path: string): Promise<UploadResult> => {
    setIsUploading(true);
    
    try {
      // 1. Upload the file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true, // Overwrite existing file at the path
        });

      if (error) {
        throw new Error(error.message);
      }

      // 2. Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(path);

      if (!publicUrlData.publicUrl) {
        throw new Error("Failed to retrieve public URL after upload.");
      }

      return { url: publicUrlData.publicUrl, error: null };

    } catch (e: any) {
      console.error("Upload failed:", e);
      toast.error(`Image upload failed: ${e.message}`);
      return { url: null, error: e.message };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadFile,
  };
}