import { createClient } from '@supabase/supabase-js';

const SUPABASE_REQUEST_TIMEOUT_MS = 20_000;

const fetchWithTimeout: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const requestInit = init ?? {};
  const controller = new AbortController();
  const callerSignal = requestInit.signal;
  let timedOut = false;

  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) {
    abortFromCaller();
  } else {
    callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  }

  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, SUPABASE_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...requestInit, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new Error('Supabase took longer than 20 seconds to respond. Check the device connection and try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  !supabaseUrl.includes('YOUR_PROJECT') &&
  !supabasePublishableKey.includes('YOUR_KEY')
);

// Keep only the Supabase auth session on this device so users stay signed in
// across app restarts. Production data continues to load from Supabase and is
// not cached here.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      global: {
        fetch: fetchWithTimeout,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
    );
  }
  return supabase;
}
