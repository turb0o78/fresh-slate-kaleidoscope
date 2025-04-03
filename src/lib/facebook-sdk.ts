
// Typages pour l'API Facebook
interface FacebookLoginStatus {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    expiresIn: string;
    signedRequest: string;
    userID: string;
  };
}

interface FacebookLoginOptions {
  scope?: string;
  return_scopes?: boolean;
  enable_profile_selector?: boolean;
}

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    FB: {
      init: (options: any) => void;
      AppEvents: {
        logPageView: () => void;
      };
      login: (callback: (response: FacebookLoginStatus) => void, options?: FacebookLoginOptions) => void;
      logout: (callback: (response: any) => void) => void;
      getLoginStatus: (callback: (response: FacebookLoginStatus) => void) => void;
      api: (path: string, callback: (response: any) => void) => void;
      api: (path: string, method: string, params: any, callback: (response: any) => void) => void;
    };
  }
}

/**
 * Vérifie si le SDK Facebook est chargé
 */
export const isFacebookSDKLoaded = (): boolean => {
  return typeof window !== 'undefined' && window.FB !== undefined;
};

/**
 * Vérifie le statut de connexion actuel
 */
export const checkLoginStatus = (): Promise<FacebookLoginStatus> => {
  return new Promise((resolve, reject) => {
    if (!isFacebookSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    window.FB.getLoginStatus((response) => {
      resolve(response);
    });
  });
};

/**
 * Lance le processus de connexion Facebook
 */
export const initiateLogin = (scope = 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish'): Promise<FacebookLoginStatus> => {
  return new Promise((resolve, reject) => {
    if (!isFacebookSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    window.FB.login((response) => {
      if (response.status === 'connected') {
        resolve(response);
      } else {
        reject(new Error('Facebook login failed'));
      }
    }, { scope });
  });
};

/**
 * Déconnecte l'utilisateur
 */
export const logout = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isFacebookSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    window.FB.logout(() => {
      resolve();
    });
  });
};

/**
 * Récupère les informations de l'utilisateur
 */
export const getUserInfo = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!isFacebookSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    window.FB.api('/me', { fields: 'id,name,email' }, (response) => {
      if (response && !response.error) {
        resolve(response);
      } else {
        reject(response?.error || new Error('Failed to get user info'));
      }
    });
  });
};

/**
 * Récupère les pages de l'utilisateur
 */
export const getUserPages = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (!isFacebookSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    window.FB.api('/me/accounts', { fields: 'id,name,access_token,category,instagram_business_account' }, (response) => {
      if (response && !response.error) {
        resolve(response.data || []);
      } else {
        reject(response?.error || new Error('Failed to get user pages'));
      }
    });
  });
};

/**
 * Récupère les comptes Instagram associés aux pages
 */
export const getInstagramAccounts = (pages: any[]): Promise<any[]> => {
  return new Promise((resolve) => {
    const instagramAccounts: any[] = [];
    
    // Filtrer les pages qui ont un compte Instagram Business associé
    pages.forEach(page => {
      if (page.instagram_business_account) {
        instagramAccounts.push({
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token,
          instagramBusinessAccountId: page.instagram_business_account.id
        });
      }
    });
    
    resolve(instagramAccounts);
  });
};

/**
 * Crée un wrapper pour simplifier l'utilisation du SDK Facebook
 */
export const FacebookSDK = {
  isLoaded: isFacebookSDKLoaded,
  login: initiateLogin,
  logout,
  getLoginStatus: checkLoginStatus,
  getUserInfo,
  getUserPages,
  getInstagramAccounts
};

export default FacebookSDK;
