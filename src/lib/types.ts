import { Database } from './database.types';

export type SocialConnection = Database['public']['Tables']['social_connections']['Row'];
export type Workflow = Database['public']['Tables']['workflows']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export type Platform = 'tiktok' | 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'twitter';

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