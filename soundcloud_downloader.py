#!/usr/bin/env python3
"""
SoundCloud Track Downloader
Downloads audio tracks from SoundCloud URLs using yt-dlp
"""

import sys
import os
from pathlib import Path
import yt_dlp


def download_soundcloud_track(url: str, output_dir: str = "./downloads") -> None:
    """
    Download a SoundCloud track as MP3
    
    Args:
        url: SoundCloud track URL
        output_dir: Directory to save the downloaded file
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': str(output_path / '%(title)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320',
        }],
        'postprocessor_args': [
            '-ar', '44100'
        ],
        'prefer_ffmpeg': True,
        'keepvideo': False,
        'quiet': False,
        'no_warnings': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"Downloading from: {url}")
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            mp3_filename = filename.rsplit('.', 1)[0] + '.mp3'
            print(f"✓ Successfully downloaded: {mp3_filename}")
            return mp3_filename
            
    except Exception as e:
        print(f"✗ Error downloading track: {str(e)}", file=sys.stderr)
        raise


def main():
    """Main entry point for command-line usage"""
    if len(sys.argv) < 2:
        print("Usage: python soundcloud_downloader.py <soundcloud_url> [output_directory]")
        print("\nExample:")
        print("  python soundcloud_downloader.py https://soundcloud.com/sk8bandit03/freddie-gibbs-the-ghetto")
        sys.exit(1)
    
    url = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "./downloads"
    
    if not url.startswith('https://soundcloud.com/'):
        print("Error: Please provide a valid SoundCloud URL", file=sys.stderr)
        sys.exit(1)
    
    try:
        download_soundcloud_track(url, output_dir)
    except Exception:
        sys.exit(1)


if __name__ == "__main__":
    main()
