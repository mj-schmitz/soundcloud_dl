import { useState } from 'react'
import { Download, Loader2, Music2, CheckCircle2, AlertCircle, Key, Package } from 'lucide-react'
import axios from 'axios'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

export default function LikedSongs() {
  const [profileUrl, setProfileUrl] = useState('')
  const [tracks, setTracks] = useState([])
  const [selectedTracks, setSelectedTracks] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadMessage, setDownloadMessage] = useState('')
  const [downloadId, setDownloadId] = useState(null)
  const [error, setError] = useState('')
  const [estimatedSize, setEstimatedSize] = useState(null)
  const [estimating, setEstimating] = useState(false)

  const fetchLikedSongs = async () => {
    if (!profileUrl.trim()) {
      setError('Please enter a SoundCloud profile URL')
      return
    }

    setLoading(true)
    setError('')
    console.log('[LikedSongs] Fetching liked songs...')

    try {
      const response = await axios.post(`${API_BASE_URL}/liked-songs`, {
        profile_url: profileUrl
      })
      
      console.log('[LikedSongs] Fetched tracks:', response.data)
      setTracks(response.data.tracks)
      setError('')
    } catch (err) {
      console.error('[LikedSongs] Error fetching liked songs:', err)
      setError(err.response?.data?.error || 'Failed to fetch liked songs')
      setTracks([])
    } finally {
      setLoading(false)
    }
  }

  const toggleTrack = (trackId) => {
    const newSelected = new Set(selectedTracks)
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId)
    } else {
      newSelected.add(trackId)
    }
    setSelectedTracks(newSelected)
    setEstimatedSize(null) // Reset estimate when selection changes
  }

  const selectAll = () => {
    setSelectedTracks(new Set(tracks.map(t => t.id)))
    setEstimatedSize(null)
  }

  const deselectAll = () => {
    setSelectedTracks(new Set())
    setEstimatedSize(null)
  }

  const estimateDownloadSize = async () => {
    if (selectedTracks.size === 0) return

    const selectedTrackData = tracks.filter(t => selectedTracks.has(t.id))
    const urls = selectedTrackData.map(t => t.url)

    setEstimating(true)
    console.log('[LikedSongs] Estimating size for', urls.length, 'tracks')

    try {
      const response = await axios.post(`${API_BASE_URL}/estimate-size`, { urls })
      console.log('[LikedSongs] Size estimate:', response.data)
      setEstimatedSize(response.data)
    } catch (err) {
      console.error('[LikedSongs] Error estimating size:', err)
      setEstimatedSize(null)
    } finally {
      setEstimating(false)
    }
  }

  const downloadSelected = async () => {
    if (selectedTracks.size === 0) {
      setError('Please select at least one track')
      return
    }

    const selectedTrackData = tracks.filter(t => selectedTracks.has(t.id))
    const urls = selectedTrackData.map(t => t.url)

    console.log('[LikedSongs] Starting bulk download for', urls.length, 'tracks')
    setDownloading(true)
    setError('')

    try {
      const response = await axios.post(`${API_BASE_URL}/bulk-download`, { urls })
      const { download_id } = response.data
      setDownloadId(download_id)
      console.log('[LikedSongs] Bulk download initiated:', download_id)

      pollDownloadStatus(download_id)
    } catch (err) {
      console.error('[LikedSongs] Error starting bulk download:', err)
      setError(err.response?.data?.error || 'Failed to start download')
      setDownloading(false)
    }
  }

  const pollDownloadStatus = async (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/${id}`)
        const data = response.data
        
        console.log('[LikedSongs] Download status:', data)
        setDownloadProgress(data.progress || 0)
        setDownloadMessage(data.message || '')

        if (data.status === 'completed') {
          clearInterval(interval)
          setDownloading(false)
          handleDownloadFile(id)
        } else if (data.status === 'error') {
          clearInterval(interval)
          setDownloading(false)
          setError(data.message)
        }
      } catch (err) {
        console.error('[LikedSongs] Error polling status:', err)
        clearInterval(interval)
        setDownloading(false)
        setError('Failed to check download status')
      }
    }, 1000)
  }

  const handleDownloadFile = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/download/${id}`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { type: 'application/zip' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'soundcloud_tracks.zip'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      
      console.log('[LikedSongs] Zip file downloaded successfully')
    } catch (err) {
      console.error('[LikedSongs] Error downloading file:', err)
      setError('Failed to download zip file')
    }
  }

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="mb-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="relative">
            <Music2 className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Liked Songs</h1>
        <p className="text-muted-foreground text-lg">
          Download all your liked SoundCloud tracks
        </p>
      </div>

      <Card className="border-2 shadow-2xl mb-6">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl">Enter Profile URL</CardTitle>
          <CardDescription>
            Enter any public SoundCloud profile URL to view their liked songs
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="https://soundcloud.com/username or https://soundcloud.com/username/likes"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                disabled={loading}
                className="h-12 text-base flex-1"
              />
              <Button
                onClick={fetchLikedSongs}
                disabled={loading || !profileUrl.trim()}
                size="lg"
                className="h-12"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Music2 className="w-5 h-5" />
                    Fetch Liked Songs
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Works with any public SoundCloud profile. No login required!
            </p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border-2 border-destructive/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {tracks.length > 0 && (
        <Card className="border-2 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                Your Liked Songs ({tracks.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
            <CardDescription>
              Select tracks to download • {selectedTracks.size} selected
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {downloading && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{downloadMessage}</span>
                  <span className="font-bold text-primary">{Math.round(downloadProgress)}%</span>
                </div>
                <Progress value={downloadProgress} className="h-2" />
              </div>
            )}

            <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTracks.has(track.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleTrack(track.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedTracks.has(track.id)}
                    onChange={() => toggleTrack(track.id)}
                    className="w-4 h-4"
                  />
                  {track.thumbnail && (
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  {track.duration && (
                    <Badge variant="outline">{formatDuration(track.duration)}</Badge>
                  )}
                </div>
              ))}
            </div>

            {selectedTracks.size > 0 && !estimatedSize && (
              <Button
                onClick={estimateDownloadSize}
                disabled={estimating}
                variant="outline"
                size="lg"
                className="w-full h-12 text-base"
              >
                {estimating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Calculating size...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Estimate Download Size ({selectedTracks.size} track{selectedTracks.size !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
            )}

            {estimatedSize && (
              <div className="p-4 bg-primary/10 border-2 border-primary/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">Estimated Download Size</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedTracks.size} track{selectedTracks.size !== 1 ? 's' : ''} • {Math.floor(estimatedSize.total_duration_seconds / 60)} minutes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {estimatedSize.estimated_size_mb < 1024 
                        ? `${estimatedSize.estimated_size_mb} MB`
                        : `${estimatedSize.estimated_size_gb} GB`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">Approximate</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={downloadSelected}
              disabled={downloading || selectedTracks.size === 0}
              size="lg"
              className="w-full h-12 text-base"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Downloading {selectedTracks.size} tracks...
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  Download {selectedTracks.size} Selected Track{selectedTracks.size !== 1 ? 's' : ''} as ZIP
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
