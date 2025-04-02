
import { supabase } from './supabase';
import { Platform } from './types';

// Interface pour le contenu à publier
export interface PublishContent {
  caption?: string;  // Description/message
  mediaUrl?: string; // URL de l'image/vidéo (peut être une URL publique ou un chemin dans Supabase Storage)
  mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';  // Type de média
}

// Interface pour le résultat de la publication
export interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

// Fonction pour obtenir le token d'accès pour une plateforme
async function getAccessToken(userId: string, platform: Platform): Promise<string | null> {
  const { data, error } = await supabase
    .from('social_connections')
    .select('access_token')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single();

  if (error || !data) {
    console.error(`Error fetching ${platform} access token:`, error);
    return null;
  }

  return data.access_token;
}

// Fonction pour publier du contenu sur Facebook
export async function publishToFacebook(
  userId: string,
  pageId: string,
  content: PublishContent
): Promise<PublishResult> {
  try {
    // Obtenir le token d'accès
    const accessToken = await getAccessToken(userId, 'facebook');
    if (!accessToken) {
      return { success: false, error: 'Access token not found for Facebook' };
    }

    // Récupérer les informations sur la page
    const { data: connections } = await supabase
      .from('social_connections')
      .select('metadata')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .single();

    if (!connections) {
      return { success: false, error: 'Facebook page information not found' };
    }

    // Trouver le token de la page spécifiée
    const pageInfo = connections.metadata?.pages?.find((page: any) => page.id === pageId);
    if (!pageInfo) {
      return { success: false, error: 'Specified Facebook page not found' };
    }

    const pageToken = pageInfo.access_token;

    let endpoint = `https://graph.facebook.com/v18.0/${pageId}/`;
    let params: any = {};

    // Si nous avons une image ou vidéo
    if (content.mediaUrl) {
      endpoint += 'photos'; // ou 'videos' pour les vidéos
      params = {
        url: content.mediaUrl,
        caption: content.caption || '',
        access_token: pageToken
      };
    } else {
      // Publication texte uniquement
      endpoint += 'feed';
      params = {
        message: content.caption || '',
        access_token: pageToken
      };
    }

    // Requête API pour publier
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      return {
        success: false,
        error: result.error?.message || 'Failed to publish to Facebook',
      };
    }

    return {
      success: true,
      postId: result.id,
    };
  } catch (error) {
    console.error('Error publishing to Facebook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Fonction pour publier du contenu sur Instagram
export async function publishToInstagram(
  userId: string, 
  content: PublishContent
): Promise<PublishResult> {
  try {
    // Obtenir le token d'accès
    const accessToken = await getAccessToken(userId, 'instagram');
    if (!accessToken) {
      return { success: false, error: 'Access token not found for Instagram' };
    }

    // Récupérer l'ID Instagram Business
    const { data: connections } = await supabase
      .from('social_connections')
      .select('platform_user_id, metadata')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .single();

    if (!connections) {
      return { success: false, error: 'Instagram business account not found' };
    }

    const igBusinessId = connections.platform_user_id;

    // Pour Instagram, nous devons d'abord créer un container media
    if (!content.mediaUrl) {
      return { success: false, error: 'Media URL is required for Instagram posts' };
    }

    // 1. Créer un conteneur média
    const createMediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igBusinessId}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: content.mediaUrl,
          caption: content.caption || '',
          access_token: accessToken,
        }),
      }
    );

    const mediaData = await createMediaResponse.json();
    
    if (!createMediaResponse.ok || mediaData.error) {
      return {
        success: false,
        error: mediaData.error?.message || 'Failed to create Instagram media',
      };
    }

    const mediaId = mediaData.id;

    // 2. Publier le média
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igBusinessId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: mediaId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (!publishResponse.ok || publishData.error) {
      return {
        success: false,
        error: publishData.error?.message || 'Failed to publish Instagram media',
      };
    }

    return {
      success: true,
      postId: publishData.id,
    };
  } catch (error) {
    console.error('Error publishing to Instagram:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Fonction pour récupérer les médias récents d'un compte Instagram
export async function getRecentInstagramMedia(userId: string, limit: number = 10) {
  try {
    const accessToken = await getAccessToken(userId, 'instagram');
    if (!accessToken) {
      return { success: false, error: 'Access token not found for Instagram' };
    }

    const { data: connections } = await supabase
      .from('social_connections')
      .select('platform_user_id')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .single();

    if (!connections) {
      return { success: false, error: 'Instagram account not found' };
    }

    const igBusinessId = connections.platform_user_id;

    const response = await fetch(
      `https://graph.instagram.com/v18.0/${igBusinessId}/media?fields=id,media_type,media_url,permalink,thumbnail_url,timestamp,caption&limit=${limit}&access_token=${accessToken}`
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || 'Failed to fetch Instagram media',
      };
    }

    return {
      success: true,
      media: data.data,
    };
  } catch (error) {
    console.error('Error fetching Instagram media:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Fonction pour récupérer les posts récents d'une page Facebook
export async function getRecentFacebookPosts(userId: string, pageId: string, limit: number = 10) {
  try {
    const accessToken = await getAccessToken(userId, 'facebook');
    if (!accessToken) {
      return { success: false, error: 'Access token not found for Facebook' };
    }

    // Récupérer les informations sur la page
    const { data: connections } = await supabase
      .from('social_connections')
      .select('metadata')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .single();

    if (!connections) {
      return { success: false, error: 'Facebook page information not found' };
    }

    // Trouver le token de la page spécifiée
    const pageInfo = connections.metadata?.pages?.find((page: any) => page.id === pageId);
    if (!pageInfo) {
      return { success: false, error: 'Specified Facebook page not found' };
    }

    const pageToken = pageInfo.access_token;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,attachments{media,type}&limit=${limit}&access_token=${pageToken}`
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || 'Failed to fetch Facebook posts',
      };
    }

    return {
      success: true,
      posts: data.data,
    };
  } catch (error) {
    console.error('Error fetching Facebook posts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
