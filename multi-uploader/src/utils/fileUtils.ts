import fs from 'fs-extra';
import path from 'path';

export interface VideoFileInfo {
  path: string;
  name: string;
  size: number;
  extension: string;
  exists: boolean;
}

export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

/**
 * Validates if a file path exists and is a supported video format
 */
export function validateVideoFile(filePath: string): VideoFileInfo {
  const resolvedPath = path.resolve(filePath);
  const exists = fs.existsSync(resolvedPath);

  if (!exists) {
    throw new Error(`Video file not found: ${resolvedPath}`);
  }

  const stats = fs.statSync(resolvedPath);

  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${resolvedPath}`);
  }

  const extension = path.extname(resolvedPath).toLowerCase();

  if (!SUPPORTED_VIDEO_EXTENSIONS.includes(extension)) {
    throw new Error(
      `Unsupported video format: ${extension}. Supported formats: ${SUPPORTED_VIDEO_EXTENSIONS.join(', ')}`
    );
  }

  return {
    path: resolvedPath,
    name: path.basename(resolvedPath),
    size: stats.size,
    extension,
    exists: true,
  };
}

/**
 * Gets all video files from a directory
 */
export function getVideoFilesFromDirectory(directoryPath: string): VideoFileInfo[] {
  const resolvedPath = path.resolve(directoryPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Directory not found: ${resolvedPath}`);
  }

  const stats = fs.statSync(resolvedPath);

  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${resolvedPath}`);
  }

  const files = fs.readdirSync(resolvedPath);
  const videoFiles: VideoFileInfo[] = [];

  for (const file of files) {
    const filePath = path.join(resolvedPath, file);
    const fileStats = fs.statSync(filePath);

    if (fileStats.isFile()) {
      const extension = path.extname(file).toLowerCase();

      if (SUPPORTED_VIDEO_EXTENSIONS.includes(extension)) {
        videoFiles.push({
          path: filePath,
          name: file,
          size: fileStats.size,
          extension,
          exists: true,
        });
      }
    }
  }

  return videoFiles;
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  if (bytes === 0) return '0 Bytes';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Checks if a video file meets platform requirements
 */
export function validateVideoRequirements(videoInfo: VideoFileInfo): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // YouTube Shorts requirements
  if (videoInfo.size > 256 * 1024 * 1024) {
    // 256MB limit
    issues.push(`File size (${formatFileSize(videoInfo.size)}) exceeds YouTube Shorts 256MB limit`);
  }

  // Instagram Reels requirements
  if (videoInfo.size > 100 * 1024 * 1024) {
    // 100MB limit
    issues.push(`File size (${formatFileSize(videoInfo.size)}) exceeds Instagram Reels 100MB limit`);
  }

  // Facebook requirements
  if (videoInfo.size > 4 * 1024 * 1024 * 1024) {
    // 4GB limit
    issues.push(`File size (${formatFileSize(videoInfo.size)}) exceeds Facebook 4GB limit`);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Creates a temporary copy of a video file for processing
 */
export async function createTempVideoCopy(originalPath: string): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp');
  await fs.ensureDir(tempDir);

  const fileName = path.basename(originalPath);
  const tempPath = path.join(tempDir, `temp_${Date.now()}_${fileName}`);

  await fs.copy(originalPath, tempPath);

  return tempPath;
}

/**
 * Cleans up temporary files
 */
export async function cleanupTempFiles(tempPath: string): Promise<void> {
  try {
    await fs.remove(tempPath);
  } catch (error) {
    console.warn(`Failed to cleanup temp file ${tempPath}:`, error);
  }
}
