import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import cors from 'cors';
import { loadCredentials, validateCredentials, getAvailableYouTubeAccounts } from '../config/credentials';
import { YouTubeUploader } from '../services/youtubeUploader';
import { getVideoFilesFromDirectory, validateVideoFile } from '../utils/fileUtils';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'videos');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename but add timestamp to avoid conflicts
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    cb(null, `${basename}_${timestamp}${extension}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${extension} not supported. Allowed types: ${allowedTypes.join(', ')}`));
    }
  },
  limits: {
    fileSize: 256 * 1024 * 1024, // 256MB limit
  },
});

// Initialize uploaders
let uploaders: {
  youtube: YouTubeUploader;
} | null = null;

try {
  const credentials = loadCredentials();
  validateCredentials(credentials);
  uploaders = {
    youtube: new YouTubeUploader(credentials),
  };
  console.log('✅ YouTube uploader initialized successfully');
} catch (error) {
  console.warn('⚠️  Uploader not initialized:', error);
}

// Routes

// Serve the main interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get list of videos in the videos folder
app.get('/api/videos', async (req, res) => {
  try {
    // Use process.cwd() to get the correct path from the project root
    const videosDir = path.join(process.cwd(), 'videos');
    console.log('📁 Looking for videos in:', videosDir);
    const videos = getVideoFilesFromDirectory(videosDir);
    console.log('📹 Found videos:', videos.length);
    res.json(videos);
  } catch (error) {
    console.error('❌ Error loading videos:', error);
    res
      .status(500)
      .json({ error: 'Failed to load videos: ' + (error instanceof Error ? error.message : 'Unknown error') });
  }
});

// Upload new video file
app.post('/api/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const videoInfo = validateVideoFile(req.file.path);
    res.json({
      message: 'File uploaded successfully',
      video: videoInfo,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
});

// Schedule upload for multiple platforms
app.post('/api/schedule', async (req, res) => {
  try {
    if (!uploaders) {
      return res.status(500).json({
        error: 'Uploaders not initialized. Please check your credentials.',
      });
    }

    const {
      videoPath,
      platforms,
      title,
      description,
      hashtags,
      schedules, // { youtube: '2024-01-15T10:30:00', instagram: '2024-01-15T11:00:00', etc. }
      youtubeAccount, // Selected YouTube account (A, B, C, D, E, F)
    } = req.body;

    if (!videoPath || !platforms || platforms.length === 0) {
      return res.status(400).json({
        error: 'Video path and platforms are required',
      });
    }

    const results: any = {};

    // Process each platform
    for (const platform of platforms) {
      const scheduledTime = schedules[platform] ? new Date(schedules[platform]) : null;

      try {
        const options = {
          title: title || 'Uploaded via Multi-Uploader',
          description: description || 'Check out this amazing content!',
          tags: hashtags ? hashtags.split(/[,\s#]+/).filter((tag: string) => tag.length > 0) : [],
        };

        switch (platform) {
          case 'youtube':
            const youtubeOptions = {
              ...options,
              account: youtubeAccount || 'A', // Default to account A if not specified
            };

            if (scheduledTime) {
              const result = await uploaders.youtube.scheduleVideo(videoPath, scheduledTime, youtubeOptions);
              results.youtube = { success: true, ...result, account: youtubeAccount || 'A' };
            } else {
              const result = await uploaders.youtube.uploadVideo(videoPath, youtubeOptions);
              results.youtube = { success: true, ...result, account: youtubeAccount || 'A' };
            }
            break;

          default:
            results[platform] = {
              success: false,
              error: `Platform ${platform} is not supported. Only YouTube is supported.`,
            };
            break;
        }
      } catch (error) {
        results[platform] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    res.json({ results });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Scheduling failed',
    });
  }
});

// Get platform connection status
app.get('/api/status', async (req, res) => {
  const status = {
    youtube: false,
    youtubeAccounts: getAvailableYouTubeAccounts(),
  };

  if (uploaders) {
    try {
      await uploaders.youtube.getQuotaInfo();
      status.youtube = true;
    } catch (error) {
      // YouTube connection failed
    }
  }

  res.json(status);
});

// Get available YouTube accounts
app.get('/api/youtube-accounts', (req, res) => {
  const accounts = getAvailableYouTubeAccounts();
  res.json(accounts);
});

// Delete video file
app.delete('/api/videos/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'videos', filename);

    // Security check - ensure file is in videos directory
    const videosDir = path.resolve(process.cwd(), 'videos');
    const resolvedFilePath = path.resolve(filePath);

    if (!resolvedFilePath.startsWith(videosDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await fs.remove(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Deletion failed',
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 256MB.' });
    }
  }

  res.status(500).json({
    error: error.message || 'Internal server error',
  });
});

// Start server
app.listen(port, () => {
  console.log(`🌐 Multi-Uploader Web Interface running at http://localhost:${port}`);
  console.log(`📁 Videos directory: ${path.join(process.cwd(), 'videos')}`);

  if (!uploaders) {
    console.log('⚠️  Warning: API credentials not configured. Set up your .env file to enable uploads.');
  }
});

export default app;
