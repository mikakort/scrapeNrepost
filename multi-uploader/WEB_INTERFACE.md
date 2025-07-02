# 🌐 Web Interface Guide

The YouTube Video Uploader includes a beautiful web interface that makes it easy to upload and schedule videos to YouTube.

## 🚀 Getting Started

### 1. Start the Web Interface

```bash
npm run web
```

The interface will be available at: **http://localhost:3000**

### 2. Configure API Credentials

Before uploading, make sure your `.env` file is configured with your API credentials:

```bash
cp env.example .env
# Edit .env with your actual API credentials
```

## ✨ Features

### 📁 **File Management**

- **Drag & Drop Upload**: Simply drag video files onto the upload area
- **Browse Files**: Click "Choose File" to select videos from your computer
- **Video Library**: View all uploaded videos in the `downloads/` folder
- **File Validation**: Automatic validation of file types and sizes
- **Delete Videos**: Remove unwanted videos with one click

### ⚙️ **Upload Configuration**

- **Custom Titles**: Set unique titles for your videos
- **Rich Descriptions**: Add detailed descriptions with formatting
- **Hashtag Support**: Add hashtags separated by commas or spaces
- **YouTube Account Selection**: Choose which YouTube account to upload to
- **Scheduling**: Set upload time for YouTube

### 📅 **Scheduling Options**

- **YouTube**: Upload as private, then manually publish (API limitation)
- **Immediate Upload**: Leave schedule field empty for instant upload

### 📊 **Real-time Status**

- **Connection Status**: See which platforms are properly configured
- **Upload Progress**: Real-time progress bars during file uploads
- **Results Display**: Detailed results showing success/failure for each platform
- **Direct Links**: Quick access to uploaded content

## 🎯 How to Use

### Step 1: Upload or Select Video

1. **Upload New Video**: Drag & drop or click "Choose File"
2. **Use Existing Video**: Click on any video in the library
3. **Wait for Processing**: File validation happens automatically

### Step 2: Configure Upload

1. **Enter Title**: Video title (auto-filled from filename)
2. **Add Description**: Detailed description of your content
3. **Add Hashtags**: Space or comma-separated hashtags
4. **Select YouTube Account**: Choose which YouTube account to upload to
5. **Set Schedule**: Optional scheduling for YouTube

### Step 3: Preview & Upload

1. **Preview**: Click "👁️ Preview" to review your settings
2. **Upload**: Click "🚀 Upload" to start the process
3. **Monitor**: Watch real-time progress and results

## 📱 Platform-Specific Notes

### 📺 YouTube Shorts

- ✅ **Direct uploads work** from local files
- ⚠️ **Scheduling limitation**: Videos uploaded as private, manual publishing required
- 📏 **Size limit**: 256MB maximum
- 🎬 **Best format**: MP4 with 9:16 aspect ratio

## 🔧 Technical Details

### Supported File Formats

- MP4 (recommended)
- MOV
- AVI
- MKV
- WebM

### File Size Limits

- **Upload limit**: 256MB (adjustable in server config)
- **YouTube**: 256MB maximum
- **Instagram**: 100MB maximum
- **Facebook**: 4GB maximum

### Browser Requirements

- Modern browsers with JavaScript enabled
- HTML5 drag & drop support
- XMLHttpRequest for file uploads

## 🛠️ Development

### Project Structure

```
src/web/
├── server.ts          # Express server
└── public/
    ├── index.html     # Main interface
    ├── styles.css     # Styling
    └── script.js      # JavaScript functionality
```

### API Endpoints

- `GET /` - Serve main interface
- `GET /api/videos` - List available videos
- `POST /api/upload` - Upload new video file
- `POST /api/schedule` - Schedule uploads
- `GET /api/status` - Check platform connections
- `DELETE /api/videos/:filename` - Delete video

### Customization

- **Port**: Set `PORT` environment variable (default: 3000)
- **Upload size**: Modify `limits.fileSize` in server.ts
- **Styling**: Edit `public/styles.css`
- **Functionality**: Modify `public/script.js`

## 🚨 Troubleshooting

### Common Issues

1. **YouTube shows ❌ (disconnected)**

   - Check your `.env` file has correct YouTube API credentials
   - Verify credentials are valid and not expired
   - Ensure proper API permissions are granted

2. **File upload fails**

   - Check file format is supported (MP4, MOV, AVI, MKV, WebM)
   - Verify file size is under 256MB
   - Ensure `downloads/` directory is writable

3. **YouTube scheduling doesn't work**
   - Videos uploaded as private, manual publishing required
   - Check that your YouTube account has proper permissions

### Getting Help

1. **Check server logs** in the terminal where you ran `npm run web`
2. **Open browser developer tools** (F12) to see JavaScript errors
3. **Verify API credentials** using the CLI: `npm run dev -- --info`
4. **Test individual uploads** with the CLI first

## 🎉 Tips for Success

- **Test with small files first** to verify your setup
- **Use the preview feature** to double-check your settings
- **Schedule uploads during optimal times** for your audience
- **Keep video titles under 100 characters** for better compatibility
- **Use relevant hashtags** to improve discoverability
- **Monitor the status indicators** to ensure platform connections

Happy uploading! 🚀
