import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'your-supabase-url' &&
  supabaseAnonKey !== 'your-supabase-anon-key');

// Log configuration status for debugging deployments
if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase is not configured properly!');
  console.warn('Missing environment variables:');
  if (!supabaseUrl) console.warn('- VITE_SUPABASE_URL is missing');
  if (!supabaseAnonKey) console.warn('- VITE_SUPABASE_ANON_KEY is missing');
  console.warn('Please add these environment variables in your deployment settings.');
}

let supabaseClient: any = null;

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'moodle-simulation-auth',
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'moodle-simulation@1.0.0'
        }
      }
    });

    // Set up automatic session refresh handler
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('[Supabase] Auth token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('[Supabase] User signed out');
      } else if (event === 'SIGNED_IN') {
        console.log('[Supabase] User signed in');
      }
    });

    console.log('Supabase client initialized with session persistence');
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
  }
}

export const supabase = supabaseClient;