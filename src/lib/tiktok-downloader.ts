
/**
 * Utility for downloading TikTok videos without watermark
 */

/**
 * Extract the TikTok video ID from a URL
 */
export function extractTikTokVideoId(url: string): string | null {
  const pattern = /\/video\/(\d+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Download a TikTok video without watermark
 */
export async function downloadTikTokVideo(videoId: string): Promise<Blob> {
  const apiUrl = `https://www.tikwm.com/video/media/hdplay/${videoId}.mp4`;
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  
  return await response.blob();
}

/**
 * Save a blob to the user's device
 */
export function saveVideoBlob(blob: Blob, fileName: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Create a video URL from a blob
 */
export function createVideoObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
