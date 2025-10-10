// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elfpiesdksdzbmmixxxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZnBpZXNka3NkemJtbWl4eHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjA0MTAsImV4cCI6MjA3NTQ5NjQxMH0.LPQvnGVPI9S1ks2-_gcRAkxXBRWR-qQpvuUsX8nZRw4';
if (!supabaseUrl) throw new Error('supabaseUrl is required.');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);