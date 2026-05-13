import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { GeneratedContent, GenerationRequest } from '../types';

let supabase: SupabaseClient | null = null;
const IMAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'magazine-images';


export function getClient() {
  if (!supabase) {
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Supabase credentials missing');
    }
    supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }
  return supabase;
}

export async function verifySupabaseToken(token: string) {
  const client = getClient();
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error) return null;
  return user;
}

export async function savePreference(userId: string | null, input: GenerationRequest & { gender?: string; interests?: string[]; preferred_content_types?: string[]; strict_moderation_enabled?: boolean }) {
  const client = getClient();
  // Check if preference exists for user to update or insert? 
  // Requirement says "Store ... in existing preferences table".
  // Usually preferences are 1 per user? Or per generation?
  // The current schema has an ID and a user_id. 
  // If we want "User Profile Preferences" (onboarding), it should probably be one row per user that gets updated,
  // OR we just insert a new row every time they generate (which is what the old code did for generation history).
  // BUT the requirement says "user onboarding preferences... Store these in the existing preferences table".
  // And "Prefill fields... from profile".
  // So we likely want a "latest" preference or a unique constraint.
  // Let's assume we insert a new row for history, but for "Profile" we might want to query the LATEST row.

  await client.from('preferences').insert({
    user_id: userId,
    age: input.age,
    gender: input.gender, // New
    interests: input.interests, // New
    genre: input.genre,
    theme: input.theme,
    keywords: input.keywords,
    language: input.language,
    preferred_content_types: input.preferred_content_types,
    strict_moderation_enabled: input.strict_moderation_enabled
  });
}

export async function getUserPreferences(userId: string) {
  const client = getClient();
  const { data, error } = await client
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found" (single)
  return data;
}

export async function checkUserTokens(userId: string): Promise<{ remaining: number, resetNeeded: boolean }> {
  const client = getClient();
  const { data, error } = await client.from('users').select('daily_token_quota, tokens_used_today, last_token_reset').eq('id', userId).single();
  if (error) throw error;

  // Basic check for reset needed
  const lastReset = data.last_token_reset ? new Date(data.last_token_reset) : new Date(0);
  const now = new Date();
  const resetNeeded = now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
                      now.getUTCMonth() !== lastReset.getUTCMonth() ||
                      now.getUTCDate() !== lastReset.getUTCDate();

  const remaining = resetNeeded ? data.daily_token_quota : (data.daily_token_quota - data.tokens_used_today);
  return { remaining, resetNeeded };
}

export async function updateUserTokens(userId: string, tokensUsed: number, resetNeeded: boolean) {
  const client = getClient();
  if (resetNeeded) {
    await client.from('users').update({
      tokens_used_today: tokensUsed,
      last_token_reset: new Date().toISOString()
    }).eq('id', userId);
  } else {
    // Increment tokens used
    const { data: user } = await client.from('users').select('tokens_used_today').eq('id', userId).single();
    if (user) {
      await client.from('users').update({
        tokens_used_today: user.tokens_used_today + tokensUsed
      }).eq('id', userId);
    }
  }
}

export async function findCachedContent(promptHash: string) {
  const client = getClient();
  const { data, error } = await client.from('generated_content')
    .select('*')
    .eq('prompt_hash', promptHash)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as GeneratedContent | null;
}

export async function saveGeneratedContent(
  userId: string | null,
  payload: Omit<GeneratedContent, 'id'>
) {
  const client = getClient();
  const { data, error } = await client
    .from('generated_content')
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data as GeneratedContent;
}

export async function fetchGeneratedContent(id: string) {
  const client = getClient();
  const { data, error } = await client.from('generated_content').select('*').eq('id', id).single();
  if (error) throw error;
  return data as GeneratedContent;
}

export async function saveFeedback(contentId: string, userId: string | null, rating: number, comment: string) {
  const client = getClient();
  // Upsert based on unique constraint (user_id, content_id)
  const { error } = await client.from('feedback').upsert({
    content_id: contentId,
    user_id: userId,
    rating,
    comment
  }, { onConflict: 'user_id, content_id' });
  if (error) throw error;
}

export async function getAdminFeedback() {
  const client = getClient();
  const { data, error } = await client
    .from('feedback')
    .select(`
      *,
      users:users!feedback_user_id_fkey(name, email),
      generated_content:generated_content!feedback_content_id_fkey(title)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getFeedbackStats() {
  const client = getClient();
  const { data: feedback, error } = await client
    .from('feedback')
    .select(`
      rating,
      content_id,
      generated_content:generated_content!feedback_content_id_fkey(title)
    `);

  if (error) throw error;

  if (!feedback || feedback.length === 0) {
    return {
      averageRating: 0,
      totalFeedback: 0,
      lowestRated: null
    };
  }

  const totalFeedback = feedback.length;
  const averageRating = feedback.reduce((acc, curr) => acc + curr.rating, 0) / totalFeedback;

  // Group by content to find lowest rated
  const contentMap: Record<string, { title: string, sum: number, count: number }> = {};

  feedback.forEach((f: any) => {
    if (!contentMap[f.content_id]) {
      contentMap[f.content_id] = {
        title: f.generated_content?.title || 'Unknown',
        sum: 0,
        count: 0
      };
    }
    contentMap[f.content_id].sum += f.rating;
    contentMap[f.content_id].count += 1;
  });

  let lowestRatedData = { title: '', rating: 6 };

  Object.values(contentMap).forEach(c => {
    const avg = c.sum / c.count;
    if (avg < lowestRatedData.rating) {
      lowestRatedData = { title: c.title, rating: avg };
    }
  });

  return {
    averageRating: parseFloat(averageRating.toFixed(1)),
    totalFeedback,
    lowestRated: lowestRatedData.rating === 6 ? null : lowestRatedData
  };
}

export async function findAdmin(username: string) {
  const client = getClient();
  const { data, error } = await client.from('admins').select('*').eq('username', username).single();
  if (error) throw error;
  return data;
}

export async function createUser(email: string, passwordHash: string, name: string) {
  const client = getClient();
  const { data, error } = await client
    .from('users')
    .insert({ email, password_hash: passwordHash, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findUser(email: string) {
  const client = getClient();
  const { data, error } = await client.from('users').select('*').eq('email', email).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function moderateContentRecord(contentId: string, status: 'approved' | 'rejected') {
  const client = getClient();
  const { error } = await client
    .from('generated_content')
    .update({ status })
    .eq('id', contentId);
  if (error) throw error;
}

/**
 * Fetch an image from a URL and upload it into Supabase Storage.
 * Returns the public URL stored in your bucket.
 */
export async function uploadImageFromUrl(sourceUrl: string) {
  const client = getClient();

  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/jpeg';

  const ext = contentType.split('/')[1] || 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error } = await client.storage
    .from(IMAGE_BUCKET)
    .upload(fileName, Buffer.from(arrayBuffer), {
      contentType,
      upsert: false
    });

  if (error) throw error;

  const { data } = client.storage.from(IMAGE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}


// Soft delete
export async function softDeleteContent(contentId: string) {
  const client = getClient();
  const { error } = await client
    .from('generated_content')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', contentId);
  if (error) throw error;
}

// Restore from trash
export async function restoreContent(contentId: string) {
  const client = getClient();
  const { error } = await client
    .from('generated_content')
    .update({ deleted_at: null })
    .eq('id', contentId);
  if (error) throw error;
}

// Toggle Favorite
export async function toggleFavorite(contentId: string, isFavorite: boolean) {
  const client = getClient();
  const { error } = await client
    .from('generated_content')
    .update({ is_favorite: isFavorite })
    .eq('id', contentId);
  if (error) throw error;
}

// Permanent Delete (specific item)
export async function permanentlyDeleteContent(contentId: string) {
  const client = getClient();
  const { error } = await client.from('generated_content').delete().eq('id', contentId);
  if (error) throw error;
}

// Empty Trash (delete all soft-deleted for user)
export async function emptyTrash(userId: string) {
  const client = getClient();
  const { error } = await client
    .from('generated_content')
    .delete()
    .eq('user_id', userId)
    .not('deleted_at', 'is', null);
  if (error) throw error;
}

export async function getUserLibrary(userId: string) {
  const client = getClient();
  // Fetch ALL items, including deleted (we filter in frontend or backend route, 
  // but better to fetch all and let route decide? 
  // Actually, standard library fetch should HIDE deleted. 
  // But we need to see them in Trash. 
  // Let's return everything and let the route/frontend filter? 
  // No, safer to return all here and let the route handle query params if we want to be strict.
  // For now, let's just return everything and let the frontend filter for simplicity, 
  // OR add a param to this function.

  const { data, error } = await client
    .from('generated_content')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Backfill 'type' since DB doesn't have it yet
  const typedData = (data as GeneratedContent[]).map(item => ({
    ...item,
    type: 'magazine'
  }));

  return typedData;
}

export async function getAllUsers() {
  const client = getClient();
  const { data, error } = await client.from('users').select('id, name, email, created_at, status').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateUserStatus(userId: string, status: 'active' | 'blocked') {
  const client = getClient();
  const { error } = await client.from('users').update({ status }).eq('id', userId);
  if (error) throw error;
}

export async function getAllContent() {
  const client = getClient();
  const { data, error } = await client
    .from('generated_content')
    .select(`
      *,
      users:users!generated_content_user_id_fkey(name)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as (GeneratedContent & { users: { name: string } | null })[];
}
export async function getOrCreateShadowUser(adminId: string) {
  const client = getClient();

  // 1. Get Admin details
  const { data: admin, error: adminError } = await client
    .from('admins')
    .select('*')
    .eq('id', adminId)
    .single();

  if (adminError || !admin) throw new Error('Admin not found');

  const shadowEmail = `admin_${admin.username}@internal.magine.ai`;

  // 2. Check if Shadow User exists
  const { data: user } = await client
    .from('users')
    .select('*')
    .eq('email', shadowEmail)
    .single();

  if (user) return user.id;

  // 3. Create Shadow User
  // We use a dummy hash that won't match any password login
  const { data: newUser, error: createError } = await client
    .from('users')
    .insert({
      email: shadowEmail,
      name: `Admin (${admin.username})`,
      password_hash: '$2a$10$ShadowAdminUserPlaceholderHash000000000000000000000',
      status: 'active'
    })
    .select()
    .single();

  if (createError) throw createError;
  return newUser.id;
}

export async function getAdminAnalytics() {
  const client = getClient();

  // 1. Token usage
  const { data: users, error: uErr } = await client.from('users').select('tokens_used_today');
  if (uErr) throw new Error(uErr.message);
  const totalTokensToday = (users || []).reduce((acc, u) => acc + (u.tokens_used_today || 0), 0);

  // 2. Cache hit rates
  const { data: content, error: cErr } = await client.from('generated_content').select('prompt_hash, token_cost');
  if (cErr) throw new Error(cErr.message);

  let totalGenerations = content ? content.length : 0;
  let cacheHits = content ? content.filter(c => c.token_cost === 0 && c.prompt_hash).length : 0;

  return {
    totalTokensToday,
    totalGenerations,
    cacheHits,
    cacheHitRate: totalGenerations > 0 ? (cacheHits / totalGenerations) * 100 : 0
  };
}
