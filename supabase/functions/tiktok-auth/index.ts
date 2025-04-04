
// Fonction Edge Supabase pour échanger le code d'autorisation TikTok contre un jeton d'accès
// Cette fonction est nécessaire car l'échange de token nécessite le client_secret qui ne doit pas être exposé côté client

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gestion des requêtes OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Vérification de l'authentification
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Récupération des paramètres de la requête
    const { code, redirect_uri } = await req.json()
    
    if (!code) {
      throw new Error('Missing code parameter')
    }

    console.log('Échange du code d\'autorisation TikTok contre un jeton d\'accès')
    console.log('Code reçu:', code.substring(0, 5) + '...')
    console.log('URI de redirection:', redirect_uri)

    // Récupération des secrets depuis les variables d'environnement
    const clientKey = Deno.env.get('TIKTOK_CLIENT_ID')
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')

    if (!clientKey || !clientSecret) {
      throw new Error('Missing TikTok credentials in environment variables')
    }

    // Échange du code contre un jeton d'accès
    const tokenEndpoint = 'https://open.tiktokapis.com/v2/oauth/token/'
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Erreur de réponse TikTok:', errorText)
      throw new Error(`TikTok API error: ${tokenResponse.status} ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('Réponse de TikTok:', JSON.stringify(tokenData, null, 2))

    // Récupération des informations de l'utilisateur
    const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'username'],
      }),
    })

    if (!userInfoResponse.ok) {
      throw new Error(`TikTok user info API error: ${userInfoResponse.status}`)
    }

    const userInfo = await userInfoResponse.json()
    console.log('Info utilisateur TikTok:', JSON.stringify(userInfo, null, 2))

    // Enregistrement des informations dans la base de données
    const { error: saveError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: user.id,
        platform: 'tiktok',
        platform_user_id: userInfo.data.user.open_id,
        platform_username: userInfo.data.user.display_name || userInfo.data.user.username || 'TikTok User',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        metadata: {
          expires_in: tokenData.expires_in,
          scope: tokenData.scope,
          profile: userInfo.data.user,
        },
      }, {
        onConflict: 'user_id,platform',
      })

    if (saveError) {
      console.error('Erreur lors de l\'enregistrement dans la base de données:', saveError)
      throw saveError
    }

    return new Response(
      JSON.stringify({
        success: true,
        platform: 'tiktok',
        username: userInfo.data.user.display_name || userInfo.data.user.username || 'TikTok User',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error in TikTok auth:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
