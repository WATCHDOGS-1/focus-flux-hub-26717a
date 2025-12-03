import React from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import { AdvancedImage } from '@cloudinary/react';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { byRadius } from '@cloudinary/url-gen/actions/roundCorners';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { auto } from '@cloudinary/url-gen/qualifiers/quality';

interface CloudinaryImageProps {
    publicIdOrUrl: string;
    width: number;
    height: number;
    className?: string;
}

// Initialize Cloudinary once with the cloud name
const cld = new Cloudinary({ cloud: { cloudName: 'dabc4dusm' } });

const CloudinaryImage = ({ publicIdOrUrl, width, height, className }: CloudinaryImageProps) => {
    // Function to extract public ID from a full URL
    const getPublicId = (url: string) => {
        // Cloudinary URLs often look like: .../v12345/public_id.ext
        const parts = url.split('/');
        const filenameWithExtension = parts.pop();
        if (!filenameWithExtension) return url;
        
        // Remove extension and version number (if present)
        const filename = filenameWithExtension.split('.')[0];
        const versionIndex = parts.findIndex(part => part.startsWith('v'));
        
        if (versionIndex !== -1) {
            // If a version number is present, the public ID is everything after it
            return parts.slice(versionIndex + 1).join('/') + '/' + filename;
        }
        
        // Fallback: if it's already just the public ID or a simple path
        return filename;
    };

    // Determine if the input is a full URL or just a public ID
    const isUrl = publicIdOrUrl.startsWith('http');
    
    // If it's a full URL, we need to extract the public ID for the SDK to work optimally.
    // If the URL is from an external source (not Cloudinary), we just use the URL as is, 
    // but the SDK might not apply transformations correctly.
    
    let image;
    
    if (isUrl) {
        // Simple check to see if it's a Cloudinary URL before attempting extraction
        if (publicIdOrUrl.includes(cld.config.cloud.cloudName)) {
            const extractedId = getPublicId(publicIdOrUrl);
            image = cld.image(extractedId);
        } else {
            // If it's an external URL, we can't use AdvancedImage with transformations easily.
            // Fallback to a standard img tag for external URLs.
            return <img src={publicIdOrUrl} alt="Post Image" width={width} height={height} className={className} />;
        }
    } else {
        image = cld.image(publicIdOrUrl);
    }

    // Apply transformations for optimization and display
    image
        .quality(auto())
        .resize(fill().width(width).height(height).gravity(autoGravity()));

    return (
        <AdvancedImage 
            cldImg={image} 
            className={className}
        />
    );
};

export default CloudinaryImage;