
// Define database types directly since database.types is missing
export type SocialConnection = {
  id: string;
  user_id: string;
  platform: Platform;
  platform_user_id: string;
  platform_username: string;
  access_token: string;
  refresh_token?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
};

export type Workflow = {
  id: string;
  user_id: string;
  name: string;
  source_platform: Platform;
  target_platforms: Platform[];
  is_active: boolean;
  config: WorkflowConfig;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  platform: Platform;
  platform_post_id?: string;
  status: 'draft' | 'published' | 'scheduled' | 'failed';
  scheduled_for?: string;
  published_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  features: SubscriptionFeatures;
  stripe_price_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due';
  stripe_subscription_id?: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type Platform = 'tiktok' | 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'twitter';

export interface WorkflowConfig {
  name: string;
  sourcePlatform: Platform;
  targetPlatforms: Platform[];
  autoPublish: boolean;
  removeWatermark?: boolean;
  metadata: {
    copyTitle: boolean;
    copyDescription: boolean;
    copyTags: boolean;
  };
}

export interface VideoMetadata {
  title: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  category?: string;
  privacyStatus?: 'public' | 'private' | 'unlisted';
}

export interface WorkflowError {
  platform: Platform;
  message: string;
  code: string;
  timestamp: string;
}

export interface PlatformConfig {
  name: Platform;
  label: string;
  icon: string;
  color: string;
  videoSupport: boolean;
  maxDuration: number; // in seconds
  maxFileSize: number; // in bytes
  supportedFormats: string[];
  webhookSupport: boolean;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    name: 'youtube',
    label: 'YouTube',
    icon: 'youtube',
    color: 'bg-red-600',
    videoSupport: true,
    maxDuration: 43200, // 12 hours
    maxFileSize: 128000000000, // 128GB
    supportedFormats: ['mp4', 'mov', 'avi'],
    webhookSupport: true,
  },
  {
    name: 'tiktok',
    label: 'TikTok',
    icon: 'tiktok',
    color: 'bg-black',
    videoSupport: true,
    maxDuration: 600, // 10 minutes
    maxFileSize: 2000000000, // 2GB
    supportedFormats: ['mp4', 'mov'],
    webhookSupport: true,
  },
  {
    name: 'instagram',
    label: 'Instagram',
    icon: 'instagram',
    color: 'bg-pink-600',
    videoSupport: true,
    maxDuration: 900, // 15 minutes
    maxFileSize: 650000000, // 650MB
    supportedFormats: ['mp4', 'mov'],
    webhookSupport: true,
  },
  {
    name: 'facebook',
    label: 'Facebook',
    icon: 'facebook',
    color: 'bg-blue-600',
    videoSupport: true,
    maxDuration: 14400, // 4 hours
    maxFileSize: 10000000000, // 10GB
    supportedFormats: ['mp4', 'mov'],
    webhookSupport: true,
  },
  {
    name: 'linkedin',
    label: 'LinkedIn',
    icon: 'linkedin',
    color: 'bg-blue-700',
    videoSupport: true,
    maxDuration: 600, // 10 minutes
    maxFileSize: 5000000000, // 5GB
    supportedFormats: ['mp4'],
    webhookSupport: true,
  },
  {
    name: 'twitter',
    label: 'Twitter',
    icon: 'twitter',
    color: 'bg-blue-400',
    videoSupport: true,
    maxDuration: 140, // 2 minutes 20 seconds
    maxFileSize: 512000000, // 512MB
    supportedFormats: ['mp4'],
    webhookSupport: true,
  }
];

export interface SubscriptionFeatures {
  video_uploads: number;
  accounts_per_platform: number;
  support_level: 'basic' | 'priority' | 'premium';
  analytics: 'basic' | 'advanced' | 'premium';
  white_label: boolean;
  api_access: boolean;
}

export interface SubscriptionLimits {
  remainingUploads: number;
  remainingAccounts: number;
  canUseWhiteLabel: boolean;
  canUseApi: boolean;
  analyticsLevel: 'basic' | 'advanced' | 'premium';
  supportLevel: 'basic' | 'priority' | 'premium';
}
