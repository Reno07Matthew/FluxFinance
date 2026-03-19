import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables. Check your .env file.');
}

// In dev mode, route through Vite proxy to avoid CORS issues
const effectiveUrl = import.meta.env.DEV ? 'http://localhost:3000/supabase-proxy' : supabaseUrl;

export const supabase = createClient(effectiveUrl, supabaseAnonKey);
