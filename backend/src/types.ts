export type GenerationRequest = {
  age: number;
  genre: string;
  theme: string;
  keywords: string;
  language: string;
  pages?: number;
  contentType?: 'story' | 'poem' | 'article' | 'biography';
  strictModeration?: boolean;
};

export type GeneratedContent = {
  id: string;
  user_id?: string | null;
  title: string;
  introduction: string;
  main_story: string; // Can store JSON string of MagazineStructure or plain text for other types
  character_highlights: string;
  conclusion: string;
  image_urls: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  type?: string;
  is_favorite?: boolean;
  deleted_at?: string | null;
  content_type?: string;
  prompt_hash?: string;
  token_cost?: number;
};

export type MagazinePage = {
  pageNumber: number;
  type: 'COVER' | 'EDITOR_NOTE' | 'CONTENTS' | 'INTRODUCTION' | 'CHAPTER' | 'FEATURE' | 'SUMMARY' | 'BACK_COVER';
  title?: string;
  content?: string;
  image?: string;
  imagePrompt?: string; // Semantic description for the image
  layout?: 'simple-text' | 'image-right' | 'image-left' | 'image-top' | 'image-bottom' | 'full-image' | 'quote-break';
  chapterNumber?: number;
};

export type MagazineStructure = {
  title: string;
  totalPages: number;
  pages: MagazinePage[];
};

