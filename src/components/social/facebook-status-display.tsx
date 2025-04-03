
import { FacebookAuthResponse } from '../../hooks/useFacebookAuth';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface FacebookStatusDisplayProps {
  authStatus: FacebookAuthResponse | null;
  isLoading: boolean;
}

export function FacebookStatusDisplay({ authStatus, isLoading }: FacebookStatusDisplayProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-20 bg-gray-200 rounded mb-4"></div>
      </div>
    );
  }

  if (!authStatus) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
        <p className="text-amber-800">Impossible de déterminer le statut de connexion Facebook</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Statut de connexion Facebook</CardTitle>
          <StatusBadge status={authStatus.status} />
        </div>
      </CardHeader>
      <CardContent>
        {authStatus.status === 'connected' && authStatus.authResponse && (
          <div className="space-y-4">
            <div>
              <p className="font-medium">Informations de connexion:</p>
              <ul className="text-sm text-gray-600 space-y-1 mt-1">
                <li><span className="font-medium">ID utilisateur:</span> {authStatus.authResponse.userID}</li>
                <li><span className="font-medium">Expiration:</span> {new Date(parseInt(authStatus.authResponse.expiresIn) * 1000).toLocaleString()}</li>
              </ul>
            </div>

            {authStatus.profile && (
              <div>
                <p className="font-medium">Profil:</p>
                <p className="text-sm text-gray-600">Nom: {authStatus.profile.name}</p>
                {authStatus.profile.email && (
                  <p className="text-sm text-gray-600">Email: {authStatus.profile.email}</p>
                )}
              </div>
            )}

            {authStatus.pages && authStatus.pages.length > 0 && (
              <div>
                <p className="font-medium">Pages connectées: {authStatus.pages.length}</p>
              </div>
            )}

            {authStatus.instagramAccounts && authStatus.instagramAccounts.length > 0 && (
              <div>
                <p className="font-medium">Comptes Instagram: {authStatus.instagramAccounts.length}</p>
              </div>
            )}
          </div>
        )}

        {(authStatus.status === 'not_authorized' || authStatus.status === 'unknown') && (
          <p className="text-gray-600">
            {authStatus.status === 'not_authorized' 
              ? "Vous êtes connecté à Facebook, mais vous n'avez pas autorisé notre application." 
              : "Vous n'êtes pas connecté à Facebook."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'connected':
      return <Badge className="bg-green-500">Connecté</Badge>;
    case 'not_authorized':
      return <Badge className="bg-amber-500">Non autorisé</Badge>;
    default:
      return <Badge className="bg-gray-500">Non connecté</Badge>;
  }
}
