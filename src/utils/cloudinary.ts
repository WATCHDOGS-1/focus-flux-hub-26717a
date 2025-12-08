import { toast } from "sonner";

// Extracted from user-provided URL: dabc4dusm
const CLOUDINARY_CLOUD_NAME = "dabc4dusm";
const CLOUDINARY_UPLOAD_PRESET = "dyad_unsigned_preset"; // *** MUST BE CONFIGURED AS UNSIGNED IN CLOUDINARY ***

/**
 * Uploads an image file to Cloudinary using an unsigned upload preset.
 * NOTE: For security, ensure CLOUDINARY_UPLOAD_PRESET is configured for unsigned uploads
 * and restrict access/transformations on the Cloudinary side.
 * @param file The image file to upload.
 * @returns A promise resolving to the image URL.
 */
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME) {
    toast.error("Cloudinary configuration missing.");
    throw new Error("Cloudinary configuration missing.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    toast.loading("Uploading image to Cloudinary...", { id: 'cloudinary-upload' });
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary upload failed:", errorData);
      // Use the specific error message from Cloudinary if available
      const errorMessage = errorData.error?.message || 'Server error during upload.';
      toast.error(`Image upload failed: ${errorMessage}`, { id: 'cloudinary-upload' });
      throw new Error(`Cloudinary upload failed: ${errorMessage}`);
    }

    const data = await response.json();
    
    toast.success("Image uploaded successfully!", { id: 'cloudinary-upload' });
    
    return data.secure_url;
  } catch (error) {
    console.error("Error during Cloudinary upload:", error);
    // If the error is already detailed (from the throw above), use it. Otherwise, use a generic network error.
    const message = error instanceof Error ? error.message : "Image upload failed due to network or configuration error.";
    toast.error(message, { id: 'cloudinary-upload' });
    throw new Error(message);
  }
};