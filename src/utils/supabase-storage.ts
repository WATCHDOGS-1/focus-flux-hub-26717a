import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUCKET_NAME = "focus-media"; // Assuming a bucket named 'focus-media' exists

/**
 * Uploads a file to Supabase Storage under a temporary user path.
 * @param file The file to upload.
 * @param userId The ID of the user uploading the file.
 * @returns The public URL of the uploaded file.
 */
export const uploadFileToSupabase = async (file: File, userId: string): Promise<string> => {
  // Use a unique path to prevent conflicts, including user ID
  const filePath = `${userId}/temp/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Failed to retrieve public URL after upload.");
  }

  return publicUrlData.publicUrl;
};

/**
 * Deletes a file from Supabase Storage using its public URL.
 * @param publicUrl The public URL of the file to delete.
 * @returns true if deletion was successful.
 */
export const deleteFileFromSupabase = async (publicUrl: string): Promise<boolean> => {
  // Extract the path from the public URL
  // Example URL: https://[project_id].supabase.co/storage/v1/object/public/focus-media/user_id/temp/filename
  const pathSegments = publicUrl.split('/');
  const bucketIndex = pathSegments.findIndex(segment => segment === BUCKET_NAME);
  
  if (bucketIndex === -1 || bucketIndex + 1 >= pathSegments.length) {
      console.error("Invalid Supabase public URL format for deletion:", publicUrl);
      return false;
  }
  
  // The path starts right after the bucket name
  const filePath = pathSegments.slice(bucketIndex + 1).join('/');

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error("Supabase deletion error:", error);
    // We don't throw an error here, just log it, as deletion failure shouldn't block the user experience too much.
    toast.warning(`Failed to clean up file: ${error.message}`);
    return false;
  }
  
  return true;
};