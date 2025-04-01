import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are defined
const supabaseUrl = 'https://ngkbxqkdgqisjkbzpdyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5na2J4cWtkZ3Fpc2prYnpwZHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTc3ODgsImV4cCI6MjA1ODIzMzc4OH0.nylazB_bV4mnSn1Ag97E70OA_EMKMcC57JWpSsJULmY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);