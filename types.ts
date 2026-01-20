
export enum SocialNetwork {
  LINKEDIN = 'LinkedIn',
  FACEBOOK = 'Facebook',
  INSTAGRAM = 'Instagram'
}

export enum VisualType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  SPEECH = 'SPEECH'
}

export enum PostStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED'
}

export interface SocialPost {
  id: string;
  day: string;
  network: SocialNetwork;
  content: string;
  suggestedVisual: VisualType;
  status: PostStatus;
  visualUrl?: string;
  isGeneratingVisual?: boolean;
}

export interface CompetitiveIntelligence {
  institution: string;
  category: 'Bank' | 'Fintech' | 'Money Transfer' | 'Agricultural Bank';
  trends: string[];
  lastCampaigns: string;
  sources: { title: string; uri: string }[];
}

export interface CalendarDay {
  date: Date;
  scheduledPosts: SocialPost[];
  isSelected: boolean;
}

export interface GenerationConfig {
  days: string[];
  includeCompetitiveTrends: boolean;
  userBrief?: string;
}
