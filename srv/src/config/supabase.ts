import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.ts';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (clientInstance) {
    return clientInstance;
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase URL or Key is missing. Database operations will fail.');
  }

  // Use Service Role Key if available on server, otherwise use Anon Key.
  // Note: Never log or expose this key to clients or console logs.
  const authKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || 'dummy_key';

  clientInstance = createClient(env.SUPABASE_URL || 'https://dummy.supabase.co', authKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return clientInstance;
}

export async function testSupabaseConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('tournaments').select('id').limit(1);
    const latencyMs = Date.now() - start;

    if (error) {
      return { connected: false, latencyMs, error: error.message };
    }
    return { connected: true, latencyMs };
  } catch (err: any) {
    return { connected: false, latencyMs: Date.now() - start, error: err?.message || 'Connection failed' };
  }
}
