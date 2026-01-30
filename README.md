# SoundCloud Downloader Web App

A modern full-stack web application to download audio tracks from SoundCloud as high-quality MP3 files.

## 🎵 Features

- **Modern UI**: Sleek, responsive design built with React and TailwindCSS
- **Real-time Progress**: Live download progress tracking with visual feedback
- **High Quality**: Downloads in 320kbps MP3 format
- **Track Metadata**: Preserves artist and title information
- **Easy to Use**: Simple paste-and-download interface

## 🏗️ Architecture

- **Frontend**: React + Vite + TailwindCSS + Lucide Icons
- **Backend**: Flask REST API
- **Download Engine**: yt-dlp (most reliable SoundCloud downloader)

## 📋 Prerequisites

- **Python 3.7+**
- **Node.js 20.10+**
- **FFmpeg** (required for audio conversion)

### Installing FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

The backend API will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install Node dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Access the App

Open your browser and navigate to `http://localhost:5173`

## 📖 Usage

1. **Paste URL**: Copy any SoundCloud track URL and paste it into the input field
2. **Click Download**: Press the "Download Track" button
3. **Wait**: Watch the real-time progress as the track downloads and converts
4. **Save**: Once complete, click "Download MP3" to save the file to your device

### Example URLs

```
https://soundcloud.com/sk8bandit03/freddie-gibbs-the-ghetto
https://soundcloud.com/artist/track-name
```

## 🛠️ CLI Tool (Legacy)

The original CLI script is still available:

```bash
python soundcloud_downloader.py "https://soundcloud.com/sk8bandit03/freddie-gibbs-the-ghetto"
```

## 📁 Project Structure

```
soundcloud_transfer/
├── backend/
│   ├── app.py              # Flask API server
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── DownloadCard.jsx  # Main UI component
│   │   ├── lib/
│   │   │   └── utils.js          # Utility functions
│   │   ├── App.jsx               # Root component
│   │   └── index.css             # Tailwind styles
│   ├── package.json
│   └── vite.config.js
└── soundcloud_downloader.py  # CLI script
```

## 🔧 API Endpoints

### `POST /api/download`
Initiate a download
```json
{
  "url": "https://soundcloud.com/artist/track"
}
```

### `GET /api/status/:download_id`
Check download status

### `GET /api/download/:download_id`
Download the completed MP3 file

### `GET /api/health`
Health check endpoint

## 🐛 Troubleshooting

**Backend won't start:**
- Ensure FFmpeg is installed: `ffmpeg -version`
- Check Python version: `python --version` (3.7+)
- Install dependencies: `pip install -r backend/requirements.txt`

**Frontend won't start:**
- Check Node version: `node --version` (20.10+)
- Clear node_modules: `rm -rf node_modules && npm install`

**Download fails:**
- Verify the SoundCloud URL is correct and public
- Some tracks may be region-restricted or private
- Check backend logs for detailed error messages

**CORS errors:**
- Ensure backend is running on port 5000
- Check that frontend is configured to use `http://localhost:5000`

## 🚀 Future Enhancements

- [ ] Playlist download support
- [ ] User authentication
- [ ] Download history
- [ ] Mobile app (iOS/Android with React Native/Expo)
- [ ] Batch download queue
- [ ] Custom quality selection

## 📄 License

MIT

## 🙏 Credits

Built with:
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Download engine
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Flask](https://flask.palletsprojects.com/) - Backend API
- [Lucide](https://lucide.dev/) - Icons
