-- MagineAI Advanced Features Migration Script

-- 1. Upgrade Users Table for Quota Management
ALTER TABLE users ADD COLUMN daily_token_quota INT DEFAULT 50000;
ALTER TABLE users ADD COLUMN tokens_used_today INT DEFAULT 0;
ALTER TABLE users ADD COLUMN last_token_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN age_bracket VARCHAR(20) DEFAULT 'adult'; -- 'child', 'teen', 'adult'
ALTER TABLE users ADD COLUMN date_of_birth DATE;

-- 2. Upgrade Preferences Table for Behavioral Profiling
-- Adding JSONB instead of hard columns to allow flexible logging of preferences
ALTER TABLE preferences ADD COLUMN preferred_content_types TEXT[] DEFAULT ARRAY['story']::TEXT[];
ALTER TABLE preferences ADD COLUMN strict_moderation_enabled BOOLEAN DEFAULT FALSE;

-- 3. Upgrade Generated Content Table for Caching and Multi-Modal
ALTER TABLE generated_content ADD COLUMN content_type VARCHAR(50) DEFAULT 'story';
ALTER TABLE generated_content ADD COLUMN prompt_hash TEXT;
ALTER TABLE generated_content ADD COLUMN token_cost INT DEFAULT 0;

-- Optional: Add a unique constraint on prompt_hash if we want to enforce single cache entries
-- Assuming multiple users might generate the exact same prompt, we might want multiple rows 
-- but a shared prompt_hash lets us find ANY matching successful run.
-- We will NOT make it unique, so we can index it for fast searches.
CREATE INDEX idx_prompt_hash ON generated_content (prompt_hash);

-- Helper function to reset daily quotas (To be run by pg_cron or edge function, or manually by server)
CREATE OR REPLACE FUNCTION reset_daily_tokens()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET tokens_used_today = 0,
      last_token_reset = NOW()
  WHERE last_token_reset < (NOW() - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;
