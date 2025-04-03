
import { useState } from 'react';
import { FacebookSDKButton } from '../components/social/facebook-sdk-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../lib/auth';

export function FacebookSDKDemoPage() {
  const { user } = useAuth();
  const [facebookData, setFacebookData] = useState<any>(null);

  const handleConnected = (data: any) => {
    setFacebookData(data);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Démonstration du SDK Facebook</h1>
      
      {!user ? (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
          <p className="text-amber-800">Veuillez vous connecter pour utiliser cette fonctionnalité</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connexion avec le SDK Facebook</CardTitle>
              <CardDescription>
                Connectez votre compte Facebook pour accéder à vos pages et comptes Instagram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FacebookSDKButton onConnected={handleConnected} />
            </CardContent>
          </Card>

          {facebookData && (
            <Card>
              <CardHeader>
                <CardTitle>Données récupérées</CardTitle>
                <CardDescription>
                  Informations obtenues après la connexion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Utilisateur</h3>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                      {JSON.stringify(facebookData.userInfo, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">Pages Facebook ({facebookData.pages?.length || 0})</h3>
                    {facebookData.pages?.length > 0 ? (
                      <div className="grid gap-2">
                        {facebookData.pages.map((page: any) => (
                          <div key={page.id} className="bg-gray-100 p-2 rounded">
                            <p><strong>Nom:</strong> {page.name}</p>
                            <p><strong>Catégorie:</strong> {page.category}</p>
                            <p><strong>ID:</strong> {page.id}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Aucune page trouvée</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">Comptes Instagram Business ({facebookData.instagramAccounts?.length || 0})</h3>
                    {facebookData.instagramAccounts?.length > 0 ? (
                      <div className="grid gap-2">
                        {facebookData.instagramAccounts.map((account: any) => (
                          <div key={account.instagramBusinessAccountId} className="bg-gray-100 p-2 rounded">
                            <p><strong>Compte Instagram:</strong> {account.instagramBusinessAccountId}</p>
                            <p><strong>Associé à la page:</strong> {account.pageName}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Aucun compte Instagram Business trouvé</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default FacebookSDKDemoPage;
