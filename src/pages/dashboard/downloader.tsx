
import { TikTokDownloader } from '../../components/tiktok/tiktok-downloader';

export function DownloaderPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Content Repurposing</h1>
        <p className="text-gray-600">Download content from other platforms to repurpose across your social media accounts</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <TikTokDownloader />
      </div>
    </div>
  );
}
