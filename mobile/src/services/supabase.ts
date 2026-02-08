import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

// Read from Expo `extra` (app.config.js) or process.env fallback (for other setups)
const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY — add them to a .env file or to expo config.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);