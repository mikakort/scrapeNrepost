#!/usr/bin/env node

import { loadCredentials, validateCredentials } from './config/credentials';
import { YouTubeUploader } from './services/youtubeUploader';
import { validateVideoFile, getVideoFilesFromDirectory, formatFileSize } from './utils/fileUtils';
import path from 'path';

interface UploadOptions {
  platforms: 'youtube'[];
  videoPath?: string;
  videoDirectory?: string;
  title?: string;
  description?: string;
  tags?: string[];
  privacyStatus?: 'private' | 'unlisted' | 'public';
  dryRun?: boolean;
  scheduledTime?: Date;
}

class MultiUploader {
  private credentials: any;
  private youtubeUploader!: YouTubeUploader;

  constructor() {
    this.initializeUploaders();
  }

  private initializeUploaders(): void {
    try {
      this.credentials = loadCredentials();
      validateCredentials(this.credentials);

      this.youtubeUploader = new YouTubeUploader(this.credentials);

      console.log('✅ YouTube uploader initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize uploader:', error);
      process.exit(1);
    }
  }

  /**
   * Main upload function
   */
  async upload(options: UploadOptions): Promise<void> {
    try {
      console.log('\n🚀 Starting multi-platform video upload...\n');

      // Get video files
      const videoFiles = await this.getVideoFiles(options);

      if (videoFiles.length === 0) {
        console.log('❌ No video files found');
        return;
      }

      console.log(`📁 Found ${videoFiles.length} video file(s):`);
      videoFiles.forEach((file) => {
        console.log(`  - ${file.name} (${formatFileSize(file.size)})`);
      });

      // Validate all videos
      console.log('\n🔍 Validating video files...');
      for (const videoFile of videoFiles) {
        const requirements = validateVideoFile(videoFile.path);
        console.log(`✅ ${videoFile.name} is valid`);
      }

      // Upload to each platform
      for (const platform of options.platforms) {
        console.log(`\n📤 Uploading to ${platform.toUpperCase()}...`);

        try {
          await this.uploadToPlatform(platform, videoFiles, options);
        } catch (error) {
          console.error(`❌ Failed to upload to ${platform}:`, error);
        }
      }

      console.log('\n🎉 Multi-platform upload completed!');
    } catch (error) {
      console.error('❌ Upload failed:', error);
      process.exit(1);
    }
  }

  /**
   * Get video files from path or directory
   */
  private async getVideoFiles(options: UploadOptions): Promise<any[]> {
    if (options.videoPath) {
      const videoFile = validateVideoFile(options.videoPath);
      return [videoFile];
    } else if (options.videoDirectory) {
      return getVideoFilesFromDirectory(options.videoDirectory);
    } else {
      // Default to videos directory
      const defaultDir = path.join(process.cwd(), 'videos');
      return getVideoFilesFromDirectory(defaultDir);
    }
  }

  /**
   * Upload to a specific platform
   */
  private async uploadToPlatform(platform: string, videoFiles: any[], options: UploadOptions): Promise<void> {
    const uploadOptions = {
      title: options.title,
      description: options.description,
      tags: options.tags,
      privacyStatus: options.privacyStatus,
    };

    switch (platform) {
      case 'youtube':
        await this.uploadToYouTube(videoFiles, uploadOptions, options.dryRun, options.scheduledTime);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Upload to YouTube
   */
  private async uploadToYouTube(
    videoFiles: any[],
    options: any,
    dryRun?: boolean,
    scheduledTime?: Date
  ): Promise<void> {
    if (dryRun) {
      console.log(
        '🔍 DRY RUN: Would upload to YouTube' + (scheduledTime ? ` (scheduled for ${scheduledTime.toISOString()})` : '')
      );
      return;
    }

    if (scheduledTime) {
      // Schedule uploads
      for (const videoFile of videoFiles) {
        try {
          const result = await this.youtubeUploader.scheduleVideo(videoFile.path, scheduledTime, options);
          console.log(`📅 YouTube scheduled: ${result.videoId}`);
        } catch (error) {
          console.error(`Failed to schedule YouTube video ${videoFile.name}:`, error);
        }
      }
    } else {
      // Immediate uploads
      const videoPaths = videoFiles.map((file) => file.path);
      const results = await this.youtubeUploader.uploadMultipleVideos(videoPaths, options);

      console.log(`✅ YouTube: ${results.filter((r) => r.videoId).length}/${results.length} videos uploaded`);
    }
  }

  /**
   * Get platform information
   */
  async getPlatformInfo(): Promise<void> {
    console.log('\n📊 Platform Information:\n');

    try {
      const youtubeQuota = await this.youtubeUploader.getQuotaInfo();
      console.log('YouTube:', youtubeQuota ? '✅ Connected' : '❌ Connection failed');
    } catch (error) {
      console.log('YouTube: ❌ Connection failed');
    }
  }
}

// CLI handling
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
YouTube Video Uploader

Usage:
  npm run dev [options]
  npm start [options]

Options:
  --video <path>           Path to a single video file
  --directory <path>       Path to directory containing videos
  --platforms <list>       Comma-separated list of platforms (youtube)
  --title <title>          Video title
  --description <desc>     Video description
  --tags <tags>            Comma-separated list of tags
  --privacy <status>       Privacy status (private,unlisted,public)
  --schedule <datetime>    Schedule upload for specific date/time (ISO format: 2024-01-15T10:30:00)
  --dry-run               Show what would be uploaded without actually uploading
  --info                  Show platform connection information
  --help                  Show this help message

Examples:
  npm run dev -- --video ./videos/example.mp4 --platforms youtube
  npm run dev -- --directory ./videos --platforms youtube --dry-run
  npm run dev -- --video ./videos/example.mp4 --schedule "2024-01-15T10:30:00"
  npm run dev -- --info
`);
    return;
  }

  const uploader = new MultiUploader();

  if (args.includes('--info')) {
    await uploader.getPlatformInfo();
    return;
  }

  // Parse options
  const options: UploadOptions = {
    platforms: ['youtube'],
    dryRun: args.includes('--dry-run'),
  };

  // Parse video path or directory
  const videoIndex = args.indexOf('--video');
  if (videoIndex !== -1 && args[videoIndex + 1]) {
    options.videoPath = args[videoIndex + 1];
  }

  const directoryIndex = args.indexOf('--directory');
  if (directoryIndex !== -1 && args[directoryIndex + 1]) {
    options.videoDirectory = args[directoryIndex + 1];
  }

  // Parse platforms
  const platformsIndex = args.indexOf('--platforms');
  if (platformsIndex !== -1 && args[platformsIndex + 1]) {
    const platformsArg = args[platformsIndex + 1];
    if (platformsArg === 'all') {
      options.platforms = ['youtube'];
    } else {
      const parsedPlatforms = platformsArg.split(',');
      // Only allow youtube platform
      if (parsedPlatforms.every((p) => p === 'youtube')) {
        options.platforms = parsedPlatforms as 'youtube'[];
      } else {
        console.log('⚠️  Only YouTube platform is supported. Defaulting to YouTube.');
        options.platforms = ['youtube'];
      }
    }
  }

  // Parse other options
  const titleIndex = args.indexOf('--title');
  if (titleIndex !== -1 && args[titleIndex + 1]) {
    options.title = args[titleIndex + 1];
  }

  const descriptionIndex = args.indexOf('--description');
  if (descriptionIndex !== -1 && args[descriptionIndex + 1]) {
    options.description = args[descriptionIndex + 1];
  }

  const tagsIndex = args.indexOf('--tags');
  if (tagsIndex !== -1 && args[tagsIndex + 1]) {
    options.tags = args[tagsIndex + 1].split(',');
  }

  const privacyIndex = args.indexOf('--privacy');
  if (privacyIndex !== -1 && args[privacyIndex + 1]) {
    options.privacyStatus = args[privacyIndex + 1] as 'private' | 'unlisted' | 'public';
  }

  const scheduleIndex = args.indexOf('--schedule');
  if (scheduleIndex !== -1 && args[scheduleIndex + 1]) {
    try {
      options.scheduledTime = new Date(args[scheduleIndex + 1]);
      if (isNaN(options.scheduledTime.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (error) {
      console.error('❌ Invalid schedule time format. Use ISO format: 2024-01-15T10:30:00');
      process.exit(1);
    }
  }

  await uploader.upload(options);
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Application error:', error);
    process.exit(1);
  });
}

export { MultiUploader };
