
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { google } from "npm:googleapis@126.0.1";

// Récupération des variables d'environnement
const YOUTUBE_CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID') || '';
const YOUTUBE_CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET') || '';
const REDIRECT_URI = Deno.env.get('VITE_YOUTUBE_REDIRECT_URI') || 'http://localhost:3000/dashboard/connections';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Traitement de l'authentification YouTube");

    // Récupérer le code d'autorisation et l'URI de redirection
    const { code, redirect_uri } = await req.json();
    
    if (!code) {
      throw new Error("Code d'autorisation manquant");
    }
    
    console.log("Code d'autorisation YouTube reçu");

    // Initialiser le client OAuth2
    const oauth2Client = new google.auth.OAuth2(
      YOUTUBE_CLIENT_ID,
      YOUTUBE_CLIENT_SECRET,
      redirect_uri || REDIRECT_URI
    );
    
    // Échanger le code contre des tokens
    console.log("Échange du code contre des tokens...");
    const { tokens } = await oauth2Client.getToken(code);
    
    oauth2Client.setCredentials(tokens);
    
    if (!tokens.access_token) {
      throw new Error("Pas de token d'accès reçu");
    }
    
    console.log("Tokens YouTube reçus avec succès");
    
    // Récupérer les informations du canal YouTube
    console.log("Récupération des informations du canal YouTube...");
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });
    
    const profileResponse = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      mine: true
    });
    
    if (!profileResponse.data.items || profileResponse.data.items.length === 0) {
      throw new Error("Impossible de récupérer les informations du canal");
    }
    
    const channel = profileResponse.data.items[0];
    
    return new Response(
      JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        channel_id: channel.id,
        channel_name: channel.snippet?.title || "Chaîne YouTube",
        profile: profileResponse.data,
        scopes: tokens.scope ? tokens.scope.split(' ') : []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error("Erreur d'authentification YouTube:", error);
    
    return new Response(
      JSON.stringify({ error: true, message: error.message || "Une erreur est survenue lors de l'authentification YouTube" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
