/// <reference types="vite/client" />

// If extra values, add here:
interface ImportMetaEnv {
    VITE_SUPABASE_URL: 'https://elfpiesdksdzbmmixxxa.supabase.co';
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZnBpZXNka3NkemJtbWl4eHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjA0MTAsImV4cCI6MjA3NTQ5NjQxMH0.LPQvnGVPI9S1ks2-_gcRAkxXBRWR-qQpvuUsX8nZRw4';
    // add any other VITE_ env vars you use
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  