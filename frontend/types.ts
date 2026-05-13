export interface GenerationRequest {
    age: number;
    genre: string;
    theme: string;
    keywords: string | string[]; // Allow both for flexibility in form handling
    language: string;
    pages?: number;
    contentType?: 'story' | 'poem' | 'article' | 'biography';
    strictModeration?: boolean;
}

export interface GeneratedContent {
    id: string;
    user_id: string | null;
    title: string;
    introduction: string;
    mainStory: string; // JSON string of MagazineStructure
    characterHighlights: string;
    conclusion: string;
    content?: string; // Legacy
    images?: string[]; // Legacy mapped
    image_url?: string | null; // Legacy
    image_urls?: string[];
    type: 'magazine' | 'book' | 'story';
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    is_favorite?: boolean;
    deleted_at?: string | null;
    content_type?: string;
    prompt_hash?: string;
    token_cost?: number;
}

export interface FeedbackPayload {
    content_id: string;
    rating: number;
    comment: string;
}

export interface AdminModeration {
    contentId: string;
    action: 'approve' | 'reject';
}

export interface MagazinePage {
    pageNumber: number;
    type: 'COVER' | 'EDITOR_NOTE' | 'CONTENTS' | 'INTRODUCTION' | 'CHAPTER' | 'FEATURE' | 'SUMMARY' | 'BACK_COVER';
    title?: string;
    content?: string;
    image?: string;
    imagePrompt?: string;
    layout?: 'simple-text' | 'image-right' | 'image-left' | 'image-top' | 'image-bottom' | 'full-image' | 'quote-break';
    chapterNumber?: number;
}

export interface MagazineStructure {
    title: string;
    totalPages: number;
    pages: MagazinePage[];
}
