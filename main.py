from playwright.sync_api import sync_playwright
import requests
import os
import csv
import json
from datetime import datetime
from pathlib import Path


def download_reel(url: str, output_dir: str = "multi-uploader/videos", filename: str = "reel.mp4", metadata: dict = None):
    """Download Instagram reel and save metadata for web app"""
    os.makedirs(output_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 ... Chrome/114.0.0.0 Safari/537.36")
        page = context.new_page()
        page.goto(url, wait_until="networkidle")

        # Wait for video to load
        page.wait_for_selector("video")
        video_url = page.eval_on_selector("video", "el => el.src")
        print("Found video URL:", video_url)

        # Try to extract video metadata from Instagram
        try:
            title_element = page.query_selector('meta[property="og:title"]')
            description_element = page.query_selector(
                'meta[property="og:description"]')

            extracted_title = title_element.get_attribute(
                "content") if title_element else ""
            extracted_description = description_element.get_attribute(
                "content") if description_element else ""

            if metadata:
                metadata.update({
                    "extracted_title": extracted_title,
                    "extracted_description": extracted_description,
                    "source_url": url
                })
        except Exception as e:
            print(f"⚠️ Could not extract metadata: {e}")

        # Download video
        video_data = requests.get(video_url).content
        video_path = os.path.join(output_dir, filename)
        with open(video_path, "wb") as f:
            f.write(video_data)
        print("✅ Downloaded:", filename)

        # Save metadata for web app
        if metadata:
            metadata_path = os.path.join(
                output_dir, f"{Path(filename).stem}_metadata.json")
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)
            print("📝 Saved metadata:", f"{Path(filename).stem}_metadata.json")

        browser.close()
        return video_path


def process_urls_from_csv(csv_file: str = "urls.csv", output_dir: str = "multi-uploader/videos"):
    """Read URLs from CSV file and download each reel with metadata for web app"""
    if not os.path.exists(csv_file):
        print(f"❌ CSV file '{csv_file}' not found!")
        return

    downloaded_videos = []

    with open(csv_file, 'r', newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)

        for row_num, row in enumerate(reader, start=2):
            url = row.get('url', '').strip()
            filename = row.get('filename', f'reel_{row_num-1}.mp4').strip()

            # Extract additional metadata from CSV if available
            title = row.get('title', '').strip()
            description = row.get('description', '').strip()
            tags = row.get('tags', '').strip()

            if not url:
                print(f"⚠️ Row {row_num}: No URL found, skipping...")
                continue

            print(f"\n📥 Processing {filename} from row {row_num}...")
            print(f"URL: {url}")

            # Prepare metadata for web app
            metadata = {
                "title": title,
                "description": description,
                "tags": tags.split(',') if tags else [],
                "downloaded_at": datetime.now().isoformat(),
                "source_csv_row": row_num
            }

            try:
                video_path = download_reel(url, output_dir, filename, metadata)
                downloaded_videos.append({
                    "filename": filename,
                    "path": video_path,
                    "metadata": metadata
                })
            except Exception as e:
                print(f"❌ Error downloading {filename}: {str(e)}")
                continue

    return downloaded_videos


def show_upload_instructions():
    """Show instructions for uploading videos via web app"""
    print("\n" + "="*60)
    print("📤 UPLOAD INSTRUCTIONS")
    print("="*60)
    print("✅ Videos have been downloaded successfully!")
    print("\n🌐 To upload videos to YouTube:")
    print("1. Navigate to the multi-uploader directory:")
    print("   cd multi-uploader")
    print("\n2. Start the web interface:")
    print("   npm run web")
    print("\n3. Open your browser to: http://localhost:3000")
    print("\n4. Select videos and configure upload settings")
    print("5. Upload to YouTube with custom titles, descriptions, and tags")
    print("\n📁 Downloaded videos are in: multi-uploader/videos/")
    print("📝 Metadata files are saved alongside each video")
    print("="*60)


def create_enhanced_csv_template():
    """Create an enhanced CSV template with metadata fields for web app"""
    template_content = """url,filename,title,description,tags
https://www.instagram.com/reel/DLcDq1oIW3q/?igsh=Y2hnaXh2Yjc5cHF1,reel1.mp4,Amazing Reel #1,Check out this amazing content!,shorts,viral,funny
https://www.instagram.com/reel/EXAMPLE1/?igsh=example1,reel2.mp4,Cool Video,Another great video,reels,instagram
https://www.instagram.com/reel/EXAMPLE2/?igsh=example2,reel3.mp4,Trending Content,Latest trending video,trending,social"""

    with open("enhanced_urls.csv", "w") as f:
        f.write(template_content)
    print("📋 Created enhanced_urls.csv template with metadata fields for web app")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        if sys.argv[1] == "--create-template":
            create_enhanced_csv_template()
        elif sys.argv[1] == "--csv" and len(sys.argv) > 2:
            # Use custom CSV file
            csv_file = sys.argv[2]
            downloaded_videos = process_urls_from_csv(csv_file)
            if downloaded_videos:
                show_upload_instructions()
        else:
            print("Usage:")
            print("  python main.py                    # Process default urls.csv")
            print("  python main.py --create-template  # Create enhanced CSV template")
            print("  python main.py --csv <file>       # Use custom CSV file")
    else:
        # Default: process urls.csv
        downloaded_videos = process_urls_from_csv()
        if downloaded_videos:
            show_upload_instructions()
