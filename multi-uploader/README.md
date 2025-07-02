# YouTube Video Uploader

A TypeScript-based tool for uploading short-form videos to YouTube Shorts.

## Features

- 🎥 **YouTube upload**: Upload to YouTube Shorts with ease
- 📁 **Batch processing**: Upload multiple videos from a directory
- 🔒 **Secure credentials**: Environment-based API key management
- ✅ **Video validation**: Automatic file format and size validation
- 🎯 **Platform-specific optimization**: Tailored upload settings for YouTube
- 🚀 **CLI interface**: Easy-to-use command-line interface

## Supported Platforms

- **YouTube Shorts**: Direct upload via YouTube Data API v3

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd multi-uploader
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp env.example .env
```

4. Edit `.env` with your API credentials (see [Configuration](#configuration) section)

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# YouTube API Credentials
YOUTUBE_CLIENT_ID=your_youtube_client_id_here
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret_here

# YouTube Refresh Tokens (for multiple accounts)
# You can have up to 6 YouTube accounts (A, B, C, D, E, F)
# Only add the accounts you have configured
YOUTUBE_REFRESH_TOKEN_A=your_youtube_refresh_token_account_a_here
YOUTUBE_REFRESH_TOKEN_B=your_youtube_refresh_token_account_b_here
YOUTUBE_REFRESH_TOKEN_C=your_youtube_refresh_token_account_c_here
YOUTUBE_REFRESH_TOKEN_D=your_youtube_refresh_token_account_d_here
YOUTUBE_REFRESH_TOKEN_E=your_youtube_refresh_token_account_e_here
YOUTUBE_REFRESH_TOKEN_F=your_youtube_refresh_token_account_f_here

# Video Configuration
DEFAULT_VIDEO_TITLE=Your Video Title
DEFAULT_VIDEO_DESCRIPTION=Your video description here
DEFAULT_VIDEO_TAGS=shorts,video,content
```

### Getting API Credentials

#### YouTube

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Generate a refresh token using the OAuth flow

## Usage

### Basic Usage

Upload a single video to YouTube:

```bash
npm run dev -- --video ../downloads/example.mp4
```

Upload all videos from the downloads directory:

```bash
npm run dev -- --directory ../downloads
```

### Advanced Usage

Upload to YouTube:

```bash
npm run dev -- --video ../downloads/example.mp4 --platforms youtube
```

Customize video metadata:

```bash
npm run dev -- --video ./videos/example.mp4 \
  --title "Amazing Short Video" \
  --description "Check out this incredible content!" \
  --tags "shorts,amazing,viral" \
  --privacy private
```

Dry run (preview without uploading):

```bash
npm run dev -- --directory ./videos --dry-run
```

Check platform connections:

```bash
npm run dev -- --info
```

### Command Line Options

| Option                 | Description                         | Example                            |
| ---------------------- | ----------------------------------- | ---------------------------------- |
| `--video <path>`       | Path to a single video file         | `--video ../downloads/example.mp4` |
| `--directory <path>`   | Path to directory containing videos | `--directory ../downloads`         |
| `--platforms <list>`   | Comma-separated list of platforms   | `--platforms youtube`              |
| `--title <title>`      | Video title                         | `--title "My Amazing Video"`       |
| `--description <desc>` | Video description                   | `--description "Check this out!"`  |
| `--tags <tags>`        | Comma-separated list of tags        | `--tags "shorts,viral,funny"`      |
| `--privacy <status>`   | Privacy status                      | `--privacy private`                |
| `--dry-run`            | Preview without uploading           | `--dry-run`                        |
| `--info`               | Show platform connection info       | `--info`                           |
| `--help`               | Show help message                   | `--help`                           |

## Supported Video Formats

- MP4 (recommended)
- MOV
- AVI
- MKV
- WebM

## Platform-Specific Requirements

### YouTube Shorts

- Maximum file size: 256MB
- Recommended aspect ratio: 9:16 (vertical)
- Maximum duration: 60 seconds
- Supported formats: MP4, MOV, AVI, MKV, WebM

## Project Structure

```
multi-uploader/
├── src/
│   ├── config/
│   │   └── credentials.ts            # API credentials management
│   ├── services/
│   │   └── youtubeUploader.ts        # YouTube upload service
│   ├── utils/
│   │   └── fileUtils.ts              # Video file utilities
│   └── index.ts                      # Main application entry point
├── ../downloads/                      # Video files directory (in root)
├── .env                              # Environment variables (create from env.example)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Building the Project

```bash
npm run build
```

### Running in Development Mode

```bash
npm run dev
```

### Running Production Build

```bash
npm start
```

## Error Handling

The application includes comprehensive error handling:

- **Credential validation**: Checks for required environment variables
- **File validation**: Validates video file existence and format
- **Platform-specific errors**: Handles API errors from each platform
- **Rate limiting**: Implements delays between uploads to avoid rate limits

## Troubleshooting

### Common Issues

1. **Missing credentials**: Ensure all required environment variables are set
2. **Invalid video format**: Check that your video is in a supported format
3. **File size too large**: Verify your video meets platform size limits
4. **API rate limits**: The app includes delays, but you may need to wait longer
5. **Instagram/Facebook URL requirement**: These platforms require publicly accessible video URLs

### Getting Help

1. Check the platform connection status: `npm run dev -- --info`
2. Run with dry-run to see what would be uploaded: `npm run dev -- --dry-run`
3. Check the console output for specific error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This tool is for educational and personal use. Please ensure you comply with each platform's Terms of Service and API usage policies. The developers are not responsible for any violations of platform policies.
