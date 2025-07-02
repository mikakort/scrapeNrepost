#!/usr/bin/env ts-node

import { MultiUploader } from '../src/index';
import { loadCredentials } from '../src/config/credentials';
import { YouTubeUploader } from '../src/services/youtubeUploader';

/**
 * Example: How to use scheduling features for each platform
 */
async function schedulingExamples() {
  try {
    const credentials = loadCredentials();

    // Initialize uploaders
    const youtubeUploader = new YouTubeUploader(credentials);

    // Set schedule time (1 hour from now)
    const scheduledTime = new Date(Date.now() + 60 * 60 * 1000);

    console.log('🕐 Scheduling uploads for:', scheduledTime.toISOString());

    // 1. YouTube Scheduling (uploads as private, you manage the publishing)
    console.log('\n📺 YouTube Scheduling Example:');
    try {
      const youtubeResult = await youtubeUploader.scheduleVideo('./videos/example.mp4', scheduledTime, {
        title: 'My Scheduled Short',
        description: 'This video was uploaded via scheduling!',
        tags: ['shorts', 'scheduled', 'api'],
        privacyStatus: 'unlisted', // Will be uploaded as unlisted for scheduling
      });
      console.log('YouTube scheduled upload result:', youtubeResult);

      // Later, you can publish the video:
      // await youtubeUploader.updateVideoPrivacy(youtubeResult.videoId, 'public');
    } catch (error) {
      console.error('YouTube scheduling failed:', error);
    }

    // 2. Managing Scheduled Content
    console.log('\n📋 Managing Scheduled Content:');

    // List YouTube unlisted videos (potential scheduled uploads)
    try {
      const privateVideos = await youtubeUploader.listPrivateVideos();
      console.log(`YouTube unlisted videos: ${privateVideos.length}`);
    } catch (error) {
      console.error('Failed to list unlisted videos:', error);
    }
  } catch (error) {
    console.error('❌ Scheduling examples failed:', error);
  }
}

/**
 * Example: Using the CLI with scheduling
 */
function cliSchedulingExamples() {
  console.log('\n🖥️  CLI Scheduling Examples:');
  console.log('\n# Schedule a single video for tomorrow at 10:30 AM');
  console.log('npm run dev -- --video ./videos/example.mp4 --schedule "2024-01-15T10:30:00"');

  console.log('\n# Schedule multiple videos with custom metadata');
  console.log('npm run dev -- --directory ./videos \\');
  console.log('  --schedule "2024-01-15T14:00:00" \\');
  console.log('  --title "Scheduled Content" \\');
  console.log('  --description "This was scheduled!" \\');
  console.log('  --tags "scheduled,api,automation"');

  console.log('\n# Dry run to see what would be scheduled');
  console.log('npm run dev -- --video ./videos/example.mp4 \\');
  console.log('  --schedule "2024-01-15T16:30:00" \\');
  console.log('  --platforms youtube,facebook \\');
  console.log('  --dry-run');
}

/**
 * Platform-specific scheduling limitations and requirements
 */
function schedulingLimitations() {
  console.log('\n⚠️  Platform Scheduling Limitations:');

  console.log('\n📺 YouTube:');
  console.log('  • No native API scheduling support');
  console.log('  • Videos uploaded as unlisted for scheduling, manual publishing required');
  console.log('  • Use YouTube Studio for native scheduling');
  console.log('  • Can use updateVideoPrivacy() to publish programmatically');

  console.log('\n📸 Instagram:');
  console.log('  • Native scheduling support ✅');
  console.log('  • Requires Business/Creator account');
  console.log('  • Minimum: 10 minutes in future');
  console.log('  • Maximum: 75 days in future');
  console.log('  • Video must be publicly accessible URL');

  console.log('\n📘 Facebook:');
  console.log('  • Native scheduling support ✅');
  console.log('  • Requires Page access token');
  console.log('  • Video must be publicly accessible URL');
  console.log('  • Can schedule up to 6 months in advance');

  console.log('\n💡 Best Practices:');
  console.log('  • Test with dry-run first');
  console.log('  • Verify public URL accessibility for Instagram/Facebook');
  console.log('  • Consider timezone differences');
  console.log('  • Monitor scheduled content regularly');
}

// Run examples if called directly
if (require.main === module) {
  console.log('🕐 Multi-Platform Video Scheduling Examples\n');

  cliSchedulingExamples();
  schedulingLimitations();

  console.log('\n🚀 To run the actual scheduling examples:');
  console.log('1. Ensure your .env file has valid credentials');
  console.log('2. Place a test video at ./videos/example.mp4');
  console.log('3. Uncomment the line below and run this script');

  // Uncomment to run actual scheduling examples:
  // schedulingExamples();
}

export { schedulingExamples, cliSchedulingExamples, schedulingLimitations };
