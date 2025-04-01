import { supabase } from './supabase';
import type { Platform, VideoMetadata, WorkflowError } from './types';

export async function validateVideo(file: File, platform: Platform) {
  // Implement video validation logic here
  const errors: string[] = [];
  
  // Check file size
  const maxSize = getPlatformMaxFileSize(platform);
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${formatFileSize(maxSize)} limit for ${platform}`);
  }

  // Check file format
  const format = file.name.split('.').pop()?.toLowerCase();
  const supportedFormats = getPlatformSupportedFormats(platform);
  if (!format || !supportedFormats.includes(format)) {
    errors.push(`Unsupported format. ${platform} accepts: ${supportedFormats.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function processVideo(file: File) {
  // This would typically involve:
  // 1. Transcoding to the right format
  // 2. Adjusting resolution/bitrate
  // 3. Adding watermarks if needed
  // 4. Handling aspect ratio differences
  
  // For demo purposes, we'll just return the original file
  return file;
}

export async function publishVideo(
  _file: File,
  platform: Platform,
  _metadata: VideoMetadata,
  _accessToken: string
): Promise<{ success: boolean; postId?: string; error?: WorkflowError }> {
  try {
    // Implement actual video upload and publishing logic here
    // This would typically involve:
    // 1. Getting upload URL
    // 2. Uploading video chunks
    // 3. Creating post with metadata
    // 4. Handling platform-specific requirements

    // Mock successful upload
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      postId: `mock_${platform}_${Date.now()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        platform,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UPLOAD_FAILED',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export async function saveWorkflow(workflowData: any) {
  const { data, error } = await supabase
    .from('workflows')
    .insert(workflowData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Utility functions
function getPlatformMaxFileSize(platform: Platform): number {
  const sizes: Record<Platform, number> = {
    youtube: 128000000000, // 128GB
    tiktok: 2000000000, // 2GB
    instagram: 650000000, // 650MB
    twitter: 512000000, // 512MB
    facebook: 10000000000, // 10GB
    linkedin: 5000000000, // 5GB
  };
  return sizes[platform];
}

function getPlatformSupportedFormats(platform: Platform): string[] {
  const formats: Record<Platform, string[]> = {
    youtube: ['mp4', 'mov', 'avi'],
    tiktok: ['mp4', 'mov'],
    instagram: ['mp4', 'mov'],
    twitter: ['mp4'],
    facebook: ['mp4', 'mov'],
    linkedin: ['mp4'],
  };
  return formats[platform];
}

function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
}
