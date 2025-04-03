
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../lib/auth';
import { useFacebookAuth } from '../hooks/useFacebookAuth';
import { FacebookStatusDisplay } from '../components/social/facebook-status-display';
import { FacebookLoginButton } from '../components/social/facebook-login-button';
import { Facebook, LogOut } from 'lucide-react';

export function FacebookSDKDemoPage() {
  const { user } = useAuth();
  const { fbAuthStatus, isLoading, login, logout } = useFacebookAuth();

  const handleLogin = async () => {
    await login();
  };

  const handleLogout = async () => {
    await logout();
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
                Le SDK Facebook vérifie automatiquement votre statut de connexion au chargement de la page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FacebookStatusDisplay 
                  authStatus={fbAuthStatus} 
                  isLoading={isLoading} 
                />
              </div>

              <div className="flex flex-col space-y-4">
                {(!fbAuthStatus || fbAuthStatus.status !== 'connected') ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Option 1: Bouton de connexion personnalisé</h3>
                      <Button 
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Facebook className="h-4 w-4 mr-2" />
                        Se connecter avec Facebook
                      </Button>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Option 2: Bouton de connexion natif Facebook</h3>
                      <FacebookLoginButton 
                        onConnected={(data) => console.log("Facebook connecté:", data)}
                      />
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={handleLogout}
                    disabled={isLoading}
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Se déconnecter de Facebook
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {fbAuthStatus && fbAuthStatus.status === 'connected' && (
            <Card>
              <CardHeader>
                <CardTitle>Données récupérées</CardTitle>
                <CardDescription>
                  Informations obtenues après la connexion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fbAuthStatus.profile && (
                    <div>
                      <h3 className="font-semibold">Utilisateur</h3>
                      <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                        {JSON.stringify(fbAuthStatus.profile, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {fbAuthStatus.pages && (
                    <div>
                      <h3 className="font-semibold">Pages Facebook ({fbAuthStatus.pages.length || 0})</h3>
                      {fbAuthStatus.pages.length > 0 ? (
                        <div className="grid gap-2">
                          {fbAuthStatus.pages.map((page: any) => (
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
                  )}
                  
                  {fbAuthStatus.instagramAccounts && (
                    <div>
                      <h3 className="font-semibold">Comptes Instagram Business ({fbAuthStatus.instagramAccounts.length || 0})</h3>
                      {fbAuthStatus.instagramAccounts.length > 0 ? (
                        <div className="grid gap-2">
                          {fbAuthStatus.instagramAccounts.map((account: any) => (
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
                  )}
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
