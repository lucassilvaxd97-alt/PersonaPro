// Loads environment variables from .env for Expo's `extra` field (local dev + EAS builds)
require('dotenv').config();

module.exports = ({ config }) => ({
  ...config,
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    ...(config.extra || {}),
  },
});
