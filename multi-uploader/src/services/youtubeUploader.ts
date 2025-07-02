import { google } from 'googleapis';
import fs from 'fs-extra';
import { Credentials, getYouTubeCredentialsForAccount } from '../config/credentials';
import { VideoFileInfo, validateVideoRequirements } from '../utils/fileUtils';

export interface YouTubeUploadOptions {
  title?: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: 'private' | 'unlisted' | 'public';
  isShort?: boolean;
  scheduledPublishTime?: Date;
  account?: string; // YouTube account (A, B, C, D, E, F)
  madeForKids?: boolean; // Flag content as "Made for Kids"
}

export class YouTubeUploader {
  private youtube: any;
  private credentials: Credentials;

  constructor(credentials: Credentials) {
    this.credentials = credentials;
    this.youtube = this.initializeYouTubeAPI();
  }

  private initializeYouTubeAPI(account?: string): any {
    const creds = account ? getYouTubeCredentialsForAccount(account) : this.credentials.youtube;

    const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret, 'http://localhost');

    oauth2Client.setCredentials({
      refresh_token: creds.refreshToken,
    });

    return google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });
  }

  /**
   * Upload a video to YouTube Shorts
   */
  async uploadVideo(videoPath: string, options: YouTubeUploadOptions = {}): Promise<{ videoId: string; url: string }> {
    try {
      // Validate video file
      const videoInfo = await this.validateVideoFile(videoPath);

      // Check video requirements
      const requirements = validateVideoRequirements(videoInfo);
      if (!requirements.isValid) {
        throw new Error(`Video requirements not met: ${requirements.issues.join(', ')}`);
      }

      // Prepare upload parameters
      const uploadParams = this.prepareUploadParameters(options);

      console.log(`Starting YouTube upload for: ${videoInfo.name}`);
      console.log(`File size: ${this.formatFileSize(videoInfo.size)}`);
      if (options.account) {
        console.log(`Using YouTube account: ${options.account}`);
      }

      // Get YouTube API instance for the specified account
      const youtubeApi = options.account ? this.initializeYouTubeAPI(options.account) : this.youtube;

      // Create the video resource
      const videoResource = {
        snippet: {
          title: uploadParams.title,
          description: uploadParams.description,
          tags: uploadParams.tags,
          categoryId: uploadParams.categoryId,
        },
        status: {
          privacyStatus: uploadParams.privacyStatus,
          madeForKids: uploadParams.madeForKids,
        },
      };

      // Upload the video
      const response = await youtubeApi.videos.insert({
        part: ['snippet', 'status'],
        requestBody: videoResource,
        media: {
          body: fs.createReadStream(videoPath),
        },
      });

      const videoId = response.data.id;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      console.log(`✅ YouTube upload successful!`);
      console.log(`Video ID: ${videoId}`);
      console.log(`URL: ${videoUrl}`);

      return {
        videoId,
        url: videoUrl,
      };
    } catch (error) {
      console.error('❌ YouTube upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload multiple videos to YouTube
   */
  async uploadMultipleVideos(
    videoPaths: string[],
    options: YouTubeUploadOptions = {}
  ): Promise<Array<{ videoId: string; url: string; originalPath: string }>> {
    const results = [];

    for (const videoPath of videoPaths) {
      try {
        console.log(`\n📤 Uploading: ${videoPath}`);
        const result = await this.uploadVideo(videoPath, options);
        results.push({
          ...result,
          originalPath: videoPath,
        });

        // Add delay between uploads to avoid rate limiting
        await this.delay(2000);
      } catch (error) {
        console.error(`Failed to upload ${videoPath}:`, error);
        results.push({
          videoId: '',
          url: '',
          originalPath: videoPath,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private async validateVideoFile(videoPath: string): Promise<VideoFileInfo> {
    const stats = await fs.stat(videoPath);

    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${videoPath}`);
    }

    const extension = videoPath.toLowerCase().split('.').pop();
    const supportedExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

    if (!extension || !supportedExtensions.includes(extension)) {
      throw new Error(`Unsupported video format: ${extension}`);
    }

    return {
      path: videoPath,
      name: videoPath.split('/').pop() || videoPath,
      size: stats.size,
      extension: `.${extension}`,
      exists: true,
    };
  }

  private prepareUploadParameters(options: YouTubeUploadOptions) {
    return {
      title: options.title || this.credentials.video.defaultTitle,
      description: options.description || this.credentials.video.defaultDescription,
      tags: options.tags || this.credentials.video.defaultTags.split(','),
      categoryId: options.categoryId || '22', // People & Blogs
      privacyStatus: options.privacyStatus || 'public',
      isShort: options.isShort !== false, // Default to true for Shorts
      madeForKids: options.madeForKids || false, // Default to false
    };
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get upload quota information
   */
  async getQuotaInfo(): Promise<any> {
    try {
      const response = await this.youtube.quota.get({});
      return response.data;
    } catch (error) {
      console.warn('Could not retrieve quota information:', error);
      return null;
    }
  }

  /**
   * Schedule a video upload (uploads as unlisted, then schedules publication)
   * Note: YouTube API doesn't support native scheduling, so this uploads as unlisted
   * and you'll need to use external scheduling to publish later
   */
  async scheduleVideo(
    videoPath: string,
    scheduledPublishTime: Date,
    options: YouTubeUploadOptions = {}
  ): Promise<{ videoId: string; url: string; scheduledTime: string }> {
    try {
      console.log(`Scheduling YouTube video for: ${scheduledPublishTime.toISOString()}`);
      if (options.account) {
        console.log(`Using YouTube account: ${options.account}`);
      }

      // Upload as unlisted first for scheduling
      const uploadOptions = {
        ...options,
        privacyStatus: 'unlisted' as const,
      };

      const uploadResult = await this.uploadVideo(videoPath, uploadOptions);

      console.log(`✅ Video uploaded as unlisted for scheduling`);
      console.log(`Video ID: ${uploadResult.videoId}`);
      console.log(`Scheduled to publish: ${scheduledPublishTime.toISOString()}`);
      console.log(`⚠️  Note: You'll need to manually publish this video at the scheduled time`);
      console.log(`   or use YouTube Studio's built-in scheduler.`);

      return {
        ...uploadResult,
        scheduledTime: scheduledPublishTime.toISOString(),
      };
    } catch (error) {
      console.error('❌ YouTube video scheduling failed:', error);
      throw error;
    }
  }

  /**
   * Update video privacy status (useful for publishing scheduled videos)
   */
  async updateVideoPrivacy(videoId: string, privacyStatus: 'private' | 'unlisted' | 'public'): Promise<boolean> {
    try {
      console.log(`Updating video ${videoId} privacy to: ${privacyStatus}`);

      await this.youtube.videos.update({
        part: ['status'],
        requestBody: {
          id: videoId,
          status: {
            privacyStatus,
          },
        },
      });

      console.log(`✅ Video privacy updated to ${privacyStatus}`);
      return true;
    } catch (error) {
      console.error(`Failed to update video privacy:`, error);
      throw error;
    }
  }

  /**
   * Update video "Made for Kids" status
   */
  async updateMadeForKids(videoId: string, madeForKids: boolean): Promise<boolean> {
    try {
      console.log(`Updating video ${videoId} "Made for Kids" status to: ${madeForKids}`);

      await this.youtube.videos.update({
        part: ['status'],
        requestBody: {
          id: videoId,
          status: {
            madeForKids,
          },
        },
      });

      console.log(`✅ Video "Made for Kids" status updated to ${madeForKids}`);
      return true;
    } catch (error) {
      console.error(`Failed to update "Made for Kids" status:`, error);
      throw error;
    }
  }

  /**
   * Get video details
   */
  async getVideoDetails(videoId: string): Promise<any> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'status', 'statistics'],
        id: [videoId],
      });

      return response.data.items?.[0] || null;
    } catch (error) {
      console.error(`Failed to get video details:`, error);
      throw error;
    }
  }

  /**
   * List private videos (useful for managing scheduled uploads)
   */
  async listPrivateVideos(): Promise<any[]> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'status'],
        mine: true,
        maxResults: 50,
      });

      const privateVideos =
        response.data.items?.filter((video: any) => video.status?.privacyStatus === 'private') || [];

      return privateVideos;
    } catch (error) {
      console.error('Failed to list private videos:', error);
      throw error;
    }
  }
}
