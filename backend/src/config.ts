import 'dotenv/config';

export const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'magineai-dev-secret',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  imagenApiKey: process.env.IMAGEN_API_KEY || '',
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((o) => o.trim())
};

