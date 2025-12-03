import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_DIMENSION = 720; // Max width or height for the downscaled image
const BUCKET_NAME = "focus-posts";

/**
 * Resizes an image file client-side to a maximum dimension (e.g., 720p) while maintaining aspect ratio.
 * @param file The original image file.
 * @returns A Promise that resolves to a Blob of the resized image.
 */
const resizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            return reject(new Error("Failed to get canvas context."));
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas to Blob conversion failed."));
          }
        }, 'image/jpeg', 0.85); // Use JPEG for smaller file size
      };
      img.src = e.target?.result as string;
    };

    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads a file to Supabase Storage after resizing it.
 * @param file The image file to upload.
 * @param userId The ID of the user uploading the file.
 * @returns A promise resolving to the public URL of the uploaded image.
 */
export const uploadResizedImageToSupabase = async (file: File, userId: string): Promise<string> => {
  try {
    toast.loading("Resizing and uploading image...", { id: 'supabase-upload' });
    
    // 1. Resize the image
    const resizedBlob = await resizeImage(file);
    
    // 2. Define the path (e.g., posts/user_id/timestamp.jpg)
    const filePath = `posts/${userId}/${Date.now()}.jpg`;

    // 3. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, resizedBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error("Supabase upload failed:", error);
      toast.error(`Image upload failed: ${error.message}`, { id: 'supabase-upload' });
      throw new Error("Supabase upload failed.");
    }

    // 4. Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!publicUrlData) {
        throw new Error("Failed to retrieve public URL.");
    }

    toast.success("Image uploaded successfully!", { id: 'supabase-upload' });
    return publicUrlData.publicUrl;

  } catch (error: any) {
    console.error("Error during image upload:", error);
    toast.error(error.message || "Image upload failed.", { id: 'supabase-upload' });
    throw new Error(error.message || "Image upload failed.");
  }
};

/**
 * Deletes a file from Supabase Storage using its public URL.
 * @param publicUrl The public URL of the file to delete.
 */
export const deleteSupabaseFile = async (publicUrl: string) => {
    if (!publicUrl.includes(BUCKET_NAME)) {
        console.warn("Attempted to delete non-Supabase file:", publicUrl);
        return;
    }
    
    // Extract the file path from the public URL
    const pathSegments = publicUrl.split(`${BUCKET_NAME}/`);
    if (pathSegments.length < 2) {
        console.error("Could not parse file path from URL:", publicUrl);
        return;
    }
    const filePath = pathSegments[1];

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (error) {
        console.error("Failed to delete file from Supabase Storage:", error);
    }
};