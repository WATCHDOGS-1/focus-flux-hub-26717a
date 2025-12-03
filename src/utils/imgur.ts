import { toast } from "sonner";

const IMGUR_CLIENT_ID = import.meta.env.VITE_IMGUR_CLIENT_ID;
const IMGUR_UPLOAD_URL = "https://api.imgur.com/3/image";

/**
 * Uploads an image file to Imgur using the public API.
 * Requires VITE_IMGUR_CLIENT_ID to be set in the environment.
 * @param file The image file to upload.
 * @returns A promise resolving to the image URL.
 */
export const uploadImageToImgur = async (file: File): Promise<string> => {
  if (!IMGUR_CLIENT_ID) {
    toast.error("Imgur Client ID is missing. Cannot upload image.");
    throw new Error("Imgur Client ID is missing.");
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    toast.loading("Uploading image to Imgur...", { id: 'imgur-upload' });
    
    const response = await fetch(IMGUR_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Imgur upload failed:", errorData);
      toast.error(`Image upload failed: ${errorData.data?.error || 'Server error'}`, { id: 'imgur-upload' });
      throw new Error("Imgur upload failed.");
    }

    const data = await response.json();
    
    if (!data.success || !data.data.link) {
        throw new Error("Imgur upload succeeded but link was missing.");
    }
    
    toast.success("Image uploaded successfully!", { id: 'imgur-upload' });
    
    return data.data.link;
  } catch (error) {
    console.error("Error during Imgur upload:", error);
    toast.error("Image upload failed due to network or configuration error.", { id: 'imgur-upload' });
    throw new Error("Image upload failed.");
  }
};