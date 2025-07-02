# 🎬 Reposter - Instagram to YouTube Video Pipeline

A complete solution for downloading Instagram reels and uploading them to YouTube Shorts with a beautiful web interface.

## 📋 Project Overview

This project consists of two main components:

1. **Python Instagram Downloader** (`main.py`) - Downloads Instagram reels with metadata
2. **TypeScript YouTube Uploader** (`multi-uploader/`) - Web-based interface for uploading to YouTube

## 🏗️ Architecture

```
reposter/
├── main.py                    # Python Instagram downloader
├── urls.csv                   # CSV file with Instagram URLs
├── multi-uploader/           # TypeScript YouTube uploader
│   ├── src/
│   │   ├── index.ts          # CLI interface
│   │   ├── web/server.ts     # Express web server
│   │   ├── services/         # Platform upload services
│   │   ├── config/           # API credentials management
│   │   └── utils/            # File utilities
│   ├── videos/               # Downloaded videos storage
│   └── package.json          # Node.js dependencies
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Download Instagram Reels

```bash
# Install Python dependencies
pip install playwright requests

# Download reels from urls.csv
python main.py

# Or use a custom CSV file
python main.py --csv my_urls.csv

# Create an enhanced CSV template with metadata
python main.py --create-template
```

### 2. Upload to YouTube

```bash
# Navigate to the uploader
cd multi-uploader

# Install dependencies
npm install

# Set up credentials
cp env.example .env
# Edit .env with your YouTube API credentials

# Start the web interface
npm run web

# Open http://localhost:3000 in your browser
```

## 📥 Instagram Downloader (Python)

### Features

- **Automated Downloads**: Downloads Instagram reels using Playwright
- **Metadata Extraction**: Extracts title, description, and other metadata
- **CSV Support**: Processes multiple URLs from CSV files
- **Enhanced Metadata**: Supports custom titles, descriptions, and tags
- **Error Handling**: Robust error handling with detailed logging

### Usage

#### Basic Download

```bash
python main.py
```

Downloads all reels listed in `urls.csv`

#### Custom CSV File

```bash
python main.py --csv my_videos.csv
```

#### Enhanced CSV Template

```bash
python main.py --create-template
```

Creates `enhanced_urls.csv` with metadata fields:

```csv
url,filename,title,description,tags
https://www.instagram.com/reel/EXAMPLE/,reel1.mp4,Amazing Reel,Check this out!,shorts,viral
```

### CSV Format

**Basic format:**

```csv
url,filename
https://www.instagram.com/reel/EXAMPLE/,reel1.mp4
```

**Enhanced format with metadata:**

```csv
url,filename,title,description,tags
https://www.instagram.com/reel/EXAMPLE/,reel1.mp4,My Video,Description here,shorts,viral
```

### Downloaded Files

Videos are saved to `multi-uploader/videos/` with metadata:

- `reel1.mp4` - Video file
- `reel1_metadata.json` - Extracted metadata

## 📤 YouTube Uploader (TypeScript)

### Features

- **Web Interface**: Beautiful drag-and-drop interface
- **Multi-Account Support**: Upload to up to 6 YouTube accounts
- **Batch Uploads**: Upload multiple videos at once
- **Scheduling**: Schedule uploads for specific times
- **Real-time Progress**: Live upload progress tracking
- **File Validation**: Automatic video format and size validation

### Setup

#### 1. Install Dependencies

```bash
cd multi-uploader
npm install
```

#### 2. Configure YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Generate refresh tokens for your accounts

#### 3. Environment Configuration

```bash
cp env.example .env
```

Edit `.env` with your credentials:

```env
# YouTube API Credentials
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret

# YouTube Accounts (up to 6)
YOUTUBE_REFRESH_TOKEN_A=account_a_token
YOUTUBE_REFRESH_TOKEN_B=account_b_token
# ... add more accounts as needed

# Default Video Settings
DEFAULT_VIDEO_TITLE=Your Video Title
DEFAULT_VIDEO_DESCRIPTION=Your video description
DEFAULT_VIDEO_TAGS=shorts,video,content
```

### Usage

#### Web Interface (Recommended)

```bash
npm run web
```

Open http://localhost:3000

#### Command Line Interface

```bash
# Upload single video
npm run dev -- --video ./videos/reel1.mp4

# Upload all videos in directory
npm run dev -- --directory ./videos

# Upload with custom metadata
npm run dev -- --video ./videos/reel1.mp4 \
  --title "Amazing Short" \
  --description "Check this out!" \
  --tags "shorts,viral,funny"

# Schedule upload
npm run dev -- --video ./videos/reel1.mp4 \
  --schedule "2024-01-15T10:30:00"
```

## 🌐 Web Interface Guide

### Getting Started

1. **Start the server**: `npm run web`
2. **Open browser**: http://localhost:3000
3. **Upload videos**: Drag & drop or browse files
4. **Configure settings**: Set title, description, hashtags
5. **Select account**: Choose YouTube account
6. **Upload**: Click upload button

### Features

- **Drag & Drop**: Easy file upload
- **Video Library**: View all uploaded videos
- **Multi-Account**: Switch between YouTube accounts
- **Scheduling**: Set upload times
- **Real-time Status**: Live progress tracking
- **Preview**: Review settings before upload

## 📊 Supported Platforms

### Instagram (Download)

- ✅ Instagram Reels
- ✅ Instagram Posts with videos
- ✅ Metadata extraction
- ✅ Batch processing

### YouTube (Upload)

- ✅ YouTube Shorts
- ✅ Multiple accounts (A-F)
- ✅ Scheduling (uploads as private)
- ✅ Custom metadata
- ✅ Batch uploads

## 🔧 Technical Requirements

### Python Dependencies

- `playwright` - Web automation
- `requests` - HTTP requests
- `csv` - CSV file processing
- `json` - JSON handling

### Node.js Dependencies

- `googleapis` - YouTube API
- `express` - Web server
- `multer` - File uploads
- `cors` - Cross-origin requests
- `typescript` - TypeScript compilation

### Browser Requirements

- Modern browser with JavaScript
- HTML5 drag & drop support
- File upload capabilities

## 📁 File Structure

```
reposter/
├── main.py                           # Instagram downloader
├── urls.csv                          # Instagram URLs
├── multi-uploader/
│   ├── src/
│   │   ├── index.ts                  # CLI entry point
│   │   ├── web/
│   │   │   ├── server.ts             # Express server
│   │   │   └── public/               # Web interface files
│   │   ├── services/
│   │   │   └── youtubeUploader.ts    # YouTube upload service
│   │   ├── config/
│   │   │   └── credentials.ts        # API credentials
│   │   └── utils/
│   │       └── fileUtils.ts          # File utilities
│   ├── videos/                       # Downloaded videos
│   ├── examples/                     # Usage examples
│   ├── package.json                  # Dependencies
│   ├── env.example                   # Environment template
│   └── README.md                     # Uploader documentation
└── README.md                         # This file
```

## 🚨 Troubleshooting

### Instagram Download Issues

1. **Playwright not installed**

   ```bash
   playwright install chromium
   ```

2. **CSV file not found**

   - Ensure `urls.csv` exists in project root
   - Check file permissions

3. **Download fails**
   - Verify Instagram URLs are valid
   - Check internet connection
   - Instagram may block automated access

### YouTube Upload Issues

1. **API credentials invalid**

   - Verify `.env` file configuration
   - Check refresh tokens are valid
   - Ensure YouTube API is enabled

2. **Upload fails**

   - Check video format (MP4 recommended)
   - Verify file size < 256MB
   - Ensure account has upload permissions

3. **Web interface not loading**
   - Check port 3000 is available
   - Verify Node.js dependencies installed
   - Check browser console for errors

## 🔄 Complete Workflow

1. **Prepare URLs**: Add Instagram reel URLs to `urls.csv`
2. **Download**: Run `python main.py` to download videos
3. **Configure**: Set up YouTube API credentials in `.env`
4. **Upload**: Use web interface or CLI to upload to YouTube
5. **Monitor**: Check upload status and manage content

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the documentation
3. Open an issue on GitHub

---

**Happy uploading! 🚀**
