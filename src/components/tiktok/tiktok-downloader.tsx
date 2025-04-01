
import { useState } from 'react';
import { Download, Play, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { extractTikTokVideoId, downloadTikTokVideo, saveVideoBlob, createVideoObjectUrl } from '../../lib/tiktok-downloader';
import { useToast } from '../../components/ui/toast';

export function TikTokDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  };

  const processVideo = async (shouldDownload: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      const videoId = extractTikTokVideoId(url);
      if (!videoId) {
        setError('Unable to extract video ID. Please check the TikTok URL.');
        return;
      }
      
      const blob = await downloadTikTokVideo(videoId);
      
      if (shouldDownload) {
        saveVideoBlob(blob, `tiktok-${videoId}.mp4`);
        toast({
          title: "Success!",
          description: "Video downloaded successfully to your device.",
        });
      } else {
        const objectUrl = createVideoObjectUrl(blob);
        setVideoUrl(objectUrl);
        toast({
          title: "Video loaded",
          description: "Video is now playing.",
        });
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => processVideo(true);
  const handleWatch = () => processVideo(false);
  
  const addExample = () => {
    setUrl('https://www.tiktok.com/@petsfriend_0/video/7292428018801315090');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">TikTok Video Downloader</h2>
      <p className="text-gray-600 mb-6">Download TikTok videos without watermark for cross-platform sharing</p>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="tiktok-input" className="block text-sm font-medium text-gray-700 mb-2">
            Enter TikTok Video URL
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              id="tiktok-input"
              placeholder="https://www.tiktok.com/@username/video/1234567890"
              value={url}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border"
            />
          </div>
          <div className="mt-1">
            <button 
              onClick={addExample}
              className="text-xs text-primary hover:text-primary-600"
            >
              Use example URL
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <Button 
            onClick={handleDownload}
            disabled={loading || !url}
            className="flex-1"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download Video
          </Button>
          <Button 
            onClick={handleWatch}
            disabled={loading || !url}
            variant="outline"
            className="flex-1"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Watch Video
          </Button>
        </div>

        {videoUrl && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
            <div className="rounded-md overflow-hidden">
              <video 
                id="video-player"
                src={videoUrl}
                controls
                className="w-full h-auto"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
