import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface Credentials {
  youtube: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  video: {
    defaultTitle: string;
    defaultDescription: string;
    defaultTags: string;
  };
}

export function loadCredentials(): Credentials {
  const requiredEnvVars = ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  // Check for at least one YouTube refresh token
  const youtubeTokens = ['A', 'B', 'C', 'D', 'E', 'F'].filter(
    (account) => process.env[`YOUTUBE_REFRESH_TOKEN_${account}`]
  );

  if (youtubeTokens.length === 0) {
    missingVars.push('YOUTUBE_REFRESH_TOKEN_A (or B, C, D, E, F)');
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID!,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
      refreshToken: process.env.YOUTUBE_REFRESH_TOKEN_A!, // Default to A
    },
    video: {
      defaultTitle: process.env.DEFAULT_VIDEO_TITLE || 'Short Form Video',
      defaultDescription: process.env.DEFAULT_VIDEO_DESCRIPTION || 'Check out this amazing short-form video!',
      defaultTags: process.env.DEFAULT_VIDEO_TAGS || 'shorts,video,content',
    },
  };
}

export function validateCredentials(credentials: Credentials): void {
  // Validate YouTube credentials
  if (!credentials.youtube.clientId || !credentials.youtube.clientSecret || !credentials.youtube.refreshToken) {
    throw new Error('Invalid YouTube credentials');
  }
}

export function getAvailableYouTubeAccounts(): string[] {
  return ['A', 'B', 'C', 'D', 'E', 'F'].filter((account) => process.env[`YOUTUBE_REFRESH_TOKEN_${account}`]);
}

export function getYouTubeCredentialsForAccount(account: string): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
} {
  const refreshToken = process.env[`YOUTUBE_REFRESH_TOKEN_${account}`];

  if (!refreshToken) {
    throw new Error(`YouTube refresh token for account ${account} not found`);
  }

  return {
    clientId: process.env.YOUTUBE_CLIENT_ID!,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
    refreshToken: refreshToken,
  };
}
