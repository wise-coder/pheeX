const { createClient } = require("@supabase/supabase-js");

let cachedClient = null;

const getSupabaseKey = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

const hasSupabaseStorageConfig = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_STORAGE_BUCKET && getSupabaseKey());

const getSupabaseClient = () => {
  if (!hasSupabaseStorageConfig()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(process.env.SUPABASE_URL, getSupabaseKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }

  return cachedClient;
};

module.exports = {
  getSupabaseClient,
  hasSupabaseStorageConfig
};
