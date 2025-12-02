export const getYouTubeEmbedUrl = (url: string): string | null => {
  try {
    // Handle standard YouTube URLs and short URLs
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // 1. Check for Playlist ID
    const listId = params.get('list');
    if (listId) {
      // Use videoseries for playlists
      return `https://www.youtube.com/embed/videoseries?list=${listId}&autoplay=1`;
    }

    // 2. Check for Video ID (if it's a single video)
    const videoId = params.get('v');
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    
    // 3. Handle short URLs (youtu.be)
    if (urlObj.hostname === 'youtu.be') {
        const videoIdFromPath = urlObj.pathname.substring(1);
        if (videoIdFromPath) {
            return `https://www.youtube.com/embed/${videoIdFromPath}?autoplay=1`;
        }
    }

    return null;
  } catch (e) {
    // If URL parsing fails (e.g., not a valid URL)
    return null;
  }
};