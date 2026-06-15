// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client — used in client components
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Server-side admin client — used in API routes (bypasses RLS)
export function createAdminClient() {
  const { createClient: createServiceClient } = require('@supabase/supabase-js');
  return createServiceClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
