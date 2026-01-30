from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import os
from pathlib import Path
import tempfile
import uuid
from datetime import datetime
import threading
import time
import logging
import requests
import zipfile
import io
from concurrent.futures import ThreadPoolExecutor, as_completed

logging.basicConfig(
    level=logging.DEBUG,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

logger.info("Flask app initialized with CORS enabled")

DOWNLOAD_DIR = Path(tempfile.gettempdir()) / "soundcloud_downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

download_status = {}

def cleanup_old_files():
    """Clean up files older than 1 hour"""
    while True:
        try:
            current_time = time.time()
            for file_path in DOWNLOAD_DIR.glob("*"):
                if current_time - file_path.stat().st_mtime > 3600:
                    file_path.unlink()
        except Exception as e:
            print(f"Cleanup error: {e}")
        time.sleep(300)

cleanup_thread = threading.Thread(target=cleanup_old_files, daemon=True)
cleanup_thread.start()

def download_track(url: str, download_id: str):
    """Background task to download track"""
    logger.info(f"[{download_id}] Starting download for URL: {url}")
    try:
        download_status[download_id] = {
            'status': 'downloading',
            'progress': 0,
            'message': 'Starting download...'
        }
        logger.debug(f"[{download_id}] Download directory: {DOWNLOAD_DIR}")
        
        output_template = str(DOWNLOAD_DIR / f"{download_id}_%(title)s.%(ext)s")
        logger.debug(f"[{download_id}] Output template: {output_template}")
        
        def progress_hook(d):
            if d['status'] == 'downloading':
                try:
                    percent = d.get('_percent_str', '0%').strip().replace('%', '')
                    download_status[download_id]['progress'] = float(percent)
                    download_status[download_id]['message'] = f"Downloading: {percent}%"
                except:
                    pass
            elif d['status'] == 'finished':
                download_status[download_id]['message'] = 'Converting to MP3...'
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '320',
            }],
            'postprocessor_args': ['-ar', '44100'],
            'prefer_ffmpeg': True,
            'keepvideo': False,
            'quiet': True,
            'no_warnings': True,
            'progress_hooks': [progress_hook],
        }
        
        logger.info(f"[{download_id}] Initializing yt-dlp with options")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            logger.info(f"[{download_id}] Extracting track info...")
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            mp3_filename = filename.rsplit('.', 1)[0] + '.mp3'
            
            logger.info(f"[{download_id}] Download completed: {mp3_filename}")
            logger.debug(f"[{download_id}] Track title: {info.get('title', 'Unknown')}")
            logger.debug(f"[{download_id}] Artist: {info.get('uploader', 'Unknown')}")
            
            # Clean filename by removing UUID prefix
            original_filename = os.path.basename(mp3_filename)
            parts = original_filename.split('_', 1)
            clean_filename = parts[1] if len(parts) > 1 else original_filename
            
            download_status[download_id] = {
                'status': 'completed',
                'progress': 100,
                'message': 'Download complete!',
                'filename': clean_filename,
                'filepath': mp3_filename,
                'title': info.get('title', 'Unknown'),
                'artist': info.get('uploader', 'Unknown'),
                'duration': info.get('duration', 0)
            }
            
    except Exception as e:
        logger.error(f"[{download_id}] Download failed: {str(e)}")
        logger.exception("Full traceback:")
        download_status[download_id] = {
            'status': 'error',
            'progress': 0,
            'message': f'Error: {str(e)}'
        }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    logger.debug("Health check requested")
    return jsonify({'status': 'ok', 'message': 'SoundCloud Downloader API is running'})

@app.route('/api/download', methods=['POST'])
def initiate_download():
    """Initiate a download and return download ID"""
    logger.info("Download request received")
    data = request.json
    url = data.get('url')
    
    logger.debug(f"Request data: {data}")
    logger.info(f"URL to download: {url}")
    
    if not url:
        logger.warning("No URL provided in request")
        return jsonify({'error': 'URL is required'}), 400
    
    if not url.startswith('https://soundcloud.com/'):
        logger.warning(f"Invalid URL format: {url}")
        return jsonify({'error': 'Invalid SoundCloud URL'}), 400
    
    download_id = str(uuid.uuid4())
    logger.info(f"Generated download ID: {download_id}")
    
    thread = threading.Thread(target=download_track, args=(url, download_id))
    thread.start()
    logger.info(f"Download thread started for ID: {download_id}")
    
    return jsonify({
        'download_id': download_id,
        'message': 'Download initiated'
    })

@app.route('/api/status/<download_id>', methods=['GET'])
def get_status(download_id):
    """Get download status"""
    logger.debug(f"Status check for download ID: {download_id}")
    status = download_status.get(download_id)
    
    if not status:
        logger.warning(f"Download ID not found: {download_id}")
        return jsonify({'error': 'Download ID not found'}), 404
    
    logger.debug(f"Status for {download_id}: {status.get('status')} - {status.get('message')}")
    return jsonify(status)

@app.route('/api/download/<download_id>', methods=['GET'])
def download_file(download_id):
    """Download the completed file"""
    logger.info(f"File download request for ID: {download_id}")
    status = download_status.get(download_id)
    
    if not status or status['status'] != 'completed':
        logger.warning(f"File not ready for download ID: {download_id}")
        return jsonify({'error': 'File not ready'}), 404
    
    filepath = status.get('filepath')
    logger.debug(f"File path: {filepath}")
    
    if not filepath or not os.path.exists(filepath):
        logger.error(f"File not found at path: {filepath}")
        return jsonify({'error': 'File not found'}), 404
    
    logger.info(f"Sending file: {status['filename']}")
    return send_file(
        filepath,
        as_attachment=True,
        download_name=status['filename']
    )

@app.route('/api/liked-songs', methods=['POST'])
def get_liked_songs():
    """Fetch user's liked songs from SoundCloud profile URL"""
    logger.info("Liked songs request received")
    data = request.json
    profile_url = data.get('profile_url', '').strip()
    
    if not profile_url:
        logger.warning("No profile URL provided")
        return jsonify({'error': 'Profile URL is required'}), 400
    
    # Ensure the URL is a likes URL
    if '/likes' not in profile_url:
        if profile_url.endswith('/'):
            profile_url = profile_url + 'likes'
        else:
            profile_url = profile_url + '/likes'
    
    try:
        logger.info(f"Fetching liked songs from: {profile_url}")
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            'playlist_items': '1-1000',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(profile_url, download=False)
            
            if not info:
                logger.error("Failed to extract playlist info")
                return jsonify({'error': 'Failed to fetch liked songs. Make sure the profile is public.'}), 400
            
            entries = info.get('entries', [])
            
            if not entries:
                logger.warning("No liked songs found")
                return jsonify({'tracks': [], 'total': 0})
            
            tracks = []
            for entry in entries:
                if entry:
                    tracks.append({
                        'id': entry.get('id'),
                        'title': entry.get('title'),
                        'artist': entry.get('uploader') or entry.get('channel'),
                        'duration': entry.get('duration'),
                        'url': entry.get('url') or entry.get('webpage_url'),
                        'thumbnail': entry.get('thumbnail')
                    })
            
            logger.info(f"Successfully fetched {len(tracks)} liked songs")
            return jsonify({'tracks': tracks, 'total': len(tracks)})
        
    except Exception as e:
        logger.error(f"Failed to fetch liked songs: {str(e)}")
        logger.exception("Full traceback:")
        return jsonify({'error': f'Failed to fetch liked songs: {str(e)}'}), 500

@app.route('/api/estimate-size', methods=['POST'])
def estimate_size():
    """Estimate total file size for selected tracks"""
    logger.info("Size estimation request received")
    data = request.json
    urls = data.get('urls', [])
    
    if not urls:
        logger.warning("No URLs provided for size estimation")
        return jsonify({'error': 'URLs are required'}), 400
    
    try:
        total_size = 0
        total_duration = 0
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            for url in urls:
                try:
                    info = ydl.extract_info(url, download=False)
                    # Estimate: ~2.5 MB per minute for 320kbps MP3
                    duration_minutes = (info.get('duration', 0) or 0) / 60
                    estimated_mb = duration_minutes * 2.5
                    total_size += estimated_mb
                    total_duration += info.get('duration', 0) or 0
                except Exception as e:
                    logger.warning(f"Failed to get info for {url}: {str(e)}")
                    # Default estimate if we can't get duration: 10 MB per track
                    total_size += 10
        
        logger.info(f"Estimated size: {total_size:.2f} MB for {len(urls)} tracks")
        return jsonify({
            'estimated_size_mb': round(total_size, 2),
            'estimated_size_gb': round(total_size / 1024, 2),
            'total_duration_seconds': total_duration,
            'track_count': len(urls)
        })
        
    except Exception as e:
        logger.error(f"Failed to estimate size: {str(e)}")
        return jsonify({'error': f'Failed to estimate size: {str(e)}'}), 500

@app.route('/api/bulk-download', methods=['POST'])
def bulk_download():
    """Download multiple tracks and create a zip file"""
    logger.info("Bulk download request received")
    data = request.json
    urls = data.get('urls', [])
    
    if not urls:
        logger.warning("No URLs provided for bulk download")
        return jsonify({'error': 'URLs are required'}), 400
    
    download_id = str(uuid.uuid4())
    logger.info(f"Generated bulk download ID: {download_id}")
    
    download_status[download_id] = {
        'status': 'downloading',
        'progress': 0,
        'message': 'Starting bulk download...',
        'total': len(urls),
        'completed': 0
    }
    
    thread = threading.Thread(target=bulk_download_tracks, args=(urls, download_id))
    thread.start()
    
    return jsonify({
        'download_id': download_id,
        'message': 'Bulk download initiated',
        'total': len(urls)
    })

def download_single_track(url: str, idx: int, download_id: str):
    """Download a single track - used for parallel downloads"""
    try:
        output_template = str(DOWNLOAD_DIR / f"{download_id}_{idx}_%(title)s.%(ext)s")
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '320',
            }],
            'postprocessor_args': ['-ar', '44100'],
            'prefer_ffmpeg': True,
            'keepvideo': False,
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            mp3_filename = filename.rsplit('.', 1)[0] + '.mp3'
            
            if os.path.exists(mp3_filename):
                logger.info(f"[{download_id}] Successfully downloaded: {os.path.basename(mp3_filename)}")
                return mp3_filename
            return None
    except Exception as e:
        logger.error(f"[{download_id}] Failed to download track {idx + 1}: {str(e)}")
        return None

def bulk_download_tracks(urls: list, download_id: str):
    """Background task to download multiple tracks in parallel and zip them"""
    logger.info(f"[{download_id}] Starting parallel bulk download for {len(urls)} tracks")
    
    try:
        zip_path = DOWNLOAD_DIR / f"{download_id}_soundcloud_tracks.zip"
        downloaded_files = []
        completed_count = 0
        
        # Use ThreadPoolExecutor for parallel downloads
        # Using 10 concurrent downloads for maximum speed
        max_workers = 10
        logger.info(f"[{download_id}] Using {max_workers} parallel workers")
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all download tasks
            future_to_url = {executor.submit(download_single_track, url, idx, download_id): (url, idx) 
                           for idx, url in enumerate(urls)}
            
            # Process completed downloads as they finish
            for future in as_completed(future_to_url):
                url, idx = future_to_url[future]
                try:
                    mp3_file = future.result()
                    if mp3_file:
                        downloaded_files.append(mp3_file)
                    completed_count += 1
                    
                    # Update progress
                    download_status[download_id].update({
                        'progress': int((completed_count / len(urls)) * 95),  # Reserve 5% for zipping
                        'message': f'Downloaded {completed_count} of {len(urls)} tracks...',
                        'completed': completed_count
                    })
                    
                except Exception as e:
                    logger.error(f"[{download_id}] Error processing download result: {str(e)}")
                    completed_count += 1
        
        logger.info(f"[{download_id}] Parallel downloads complete. {len(downloaded_files)}/{len(urls)} successful")
        
        if not downloaded_files:
            raise Exception("No tracks were successfully downloaded")
        
        logger.info(f"[{download_id}] Creating zip file with {len(downloaded_files)} tracks")
        download_status[download_id].update({
            'message': 'Creating zip file...',
            'progress': 95
        })
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in downloaded_files:
                # Check if file still exists before trying to zip it
                if not os.path.exists(file_path):
                    logger.warning(f"[{download_id}] File no longer exists, skipping: {file_path}")
                    continue
                    
                try:
                    original_filename = os.path.basename(file_path)
                    # Remove the UUID prefix (format: uuid_idx_filename.mp3)
                    # Split by underscore and take everything after the second underscore
                    parts = original_filename.split('_', 2)
                    clean_filename = parts[2] if len(parts) > 2 else original_filename
                    zipf.write(file_path, clean_filename)
                    os.remove(file_path)
                except Exception as e:
                    logger.error(f"[{download_id}] Error adding file to zip: {file_path}, error: {str(e)}")
                    # Try to remove the file anyway if it exists
                    try:
                        if os.path.exists(file_path):
                            os.remove(file_path)
                    except:
                        pass
        
        download_status[download_id] = {
            'status': 'completed',
            'progress': 100,
            'message': 'Bulk download complete!',
            'total': len(urls),
            'completed': len(downloaded_files),
            'filename': os.path.basename(zip_path),
            'filepath': str(zip_path)
        }
        
        logger.info(f"[{download_id}] Bulk download completed successfully")
        
    except Exception as e:
        logger.error(f"[{download_id}] Bulk download failed: {str(e)}")
        logger.exception("Full traceback:")
        download_status[download_id] = {
            'status': 'error',
            'progress': 0,
            'message': f'Error: {str(e)}'
        }

if __name__ == '__main__':
    logger.info("Starting Flask server on port 5001...")
    app.run(debug=True, port=5001)
