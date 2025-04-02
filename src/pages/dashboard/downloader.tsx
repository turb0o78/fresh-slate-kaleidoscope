
// Cette page a été supprimée et remplacée par le système d'affiliation
import { Navigate } from 'react-router-dom';

export function DownloaderPage() {
  // Rediriger vers la page des referrals
  return <Navigate to="/dashboard/referrals" replace />;
}
