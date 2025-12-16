import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2MjI4NzUsImV4cCI6MjA0OTE5ODg3NX0.HNkgD3E-VU2rcq7RpJf3xQS2pNzl2Xn7aLqNX8w_wkw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
