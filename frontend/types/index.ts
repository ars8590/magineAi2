export type GenerationRequest = {
  age: number;
  genre: string;
  theme: string;
  keywords: string;
  language: string;
  pages?: number;
};

export type GeneratedContent = {
  id: string;
  title: string;
  introduction: string;
  mainStory: string;
  characterHighlights: string;
  conclusion: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export type FeedbackPayload = {
  contentId: string;
  rating: number;
  comment: string;
};

export type AdminModeration = {
  contentId: string;
  action: 'approve' | 'reject';
  reason?: string;
};

