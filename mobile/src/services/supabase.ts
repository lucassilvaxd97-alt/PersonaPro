import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://cbzkibbgwfyxrupzhvla.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiemtpYmJnd2Z5eHJ1cHpodmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzkzMTksImV4cCI6MjA4NjkxNTMxOX0.Lt7LBw012gn4J-9587aZPF8xqCyMmY4MVukcxHtXI8k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});