/*
  # Remove TikTok Webhook Tables

  1. Changes
    - Drop tiktok_webhooks table
    - Drop tiktok_videos table
    - Remove associated policies and indexes
*/

-- Drop tables and associated objects
DROP TABLE IF EXISTS tiktok_webhooks;
DROP TABLE IF EXISTS tiktok_videos;