import { useState } from 'react'
import { Download, Loader2, Music2, CheckCircle2, AlertCircle, Sparkles, Radio } from 'lucide-react'
import axios from 'axios'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

export default function DownloadCard() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [downloadId, setDownloadId] = useState(null)
  const [trackInfo, setTrackInfo] = useState(null)

  const pollStatus = async (id) => {
    console.log(`[Frontend] Polling status for download ID: ${id}`)
    try {
      const response = await axios.get(`${API_BASE_URL}/status/${id}`)
      const data = response.data
      console.log(`[Frontend] Status response:`, data)

      setStatus(data.status)
      setProgress(data.progress || 0)
      setMessage(data.message || '')

      if (data.status === 'completed') {
        console.log(`[Frontend] Download completed!`, data)
        setTrackInfo({
          title: data.title,
          artist: data.artist,
          filename: data.filename
        })
        return true
      } else if (data.status === 'error') {
        console.error(`[Frontend] Download error:`, data.message)
        return true
      }

      return false
    } catch (error) {
      console.error(`[Frontend] Failed to poll status:`, error)
      console.error(`[Frontend] Error details:`, error.response?.data)
      setStatus('error')
      setMessage('Failed to check download status')
      return true
    }
  }

  const handleDownload = async (e) => {
    e.preventDefault()
    console.log(`[Frontend] Download initiated for URL: ${url}`)

    if (!url.trim()) {
      console.warn(`[Frontend] Empty URL provided`)
      setMessage('Please enter a SoundCloud URL')
      return
    }

    if (!url.startsWith('https://soundcloud.com/')) {
      console.warn(`[Frontend] Invalid URL format: ${url}`)
      setMessage('Please enter a valid SoundCloud URL')
      return
    }

    setStatus('downloading')
    setProgress(0)
    setMessage('Initiating download...')
    setTrackInfo(null)

    try {
      console.log(`[Frontend] Sending POST request to ${API_BASE_URL}/download`)
      const response = await axios.post(`${API_BASE_URL}/download`, { url })
      console.log(`[Frontend] Download initiated response:`, response.data)
      const { download_id } = response.data
      setDownloadId(download_id)
      console.log(`[Frontend] Download ID received: ${download_id}`)
      console.log(`[Frontend] Starting status polling every 1 second`)

      const pollInterval = setInterval(async () => {
        const isDone = await pollStatus(download_id)
        if (isDone) {
          console.log(`[Frontend] Polling complete, clearing interval`)
          clearInterval(pollInterval)
        }
      }, 1000)
    } catch (error) {
      console.error(`[Frontend] Download initiation failed:`, error)
      console.error(`[Frontend] Error response:`, error.response?.data)
      console.error(`[Frontend] Error status:`, error.response?.status)
      setStatus('error')
      setMessage(error.response?.data?.error || 'Failed to start download')
    }
  }

  const handleDownloadFile = async () => {
    if (!downloadId) {
      console.warn(`[Frontend] No download ID available`)
      return
    }

    console.log(`[Frontend] Downloading file for ID: ${downloadId}`)
    try {
      const response = await axios.get(`${API_BASE_URL}/download/${downloadId}`, {
        responseType: 'blob'
      })
      console.log(`[Frontend] File received, size: ${response.data.size} bytes`)

      const blob = new Blob([response.data], { type: 'audio/mpeg' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = trackInfo?.filename || 'track.mp3'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      console.log(`[Frontend] File download triggered: ${trackInfo?.filename}`)
    } catch (error) {
      console.error(`[Frontend] File download failed:`, error)
      setMessage('Failed to download file')
    }
  }

  const resetForm = () => {
    setUrl('')
    setStatus('idle')
    setProgress(0)
    setMessage('')
    setDownloadId(null)
    setTrackInfo(null)
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="mb-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="relative">
            <Music2 className="w-12 h-12 text-primary" />
            <Sparkles className="w-5 h-5 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">SoundCloud Downloader</h1>
        <p className="text-muted-foreground text-lg">
          Download your favorite tracks in high-quality MP3 format
        </p>
      </div>

      <Card className="border-2 shadow-2xl">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Download Track</CardTitle>
            {status === 'idle' && (
              <Badge variant="outline" className="gap-1">
                <Radio className="w-3 h-3" />
                Ready
              </Badge>
            )}
            {status === 'downloading' && (
              <Badge className="gap-1 bg-primary">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing
              </Badge>
            )}
            {status === 'completed' && (
              <Badge className="gap-1 bg-green-600">
                <CheckCircle2 className="w-3 h-3" />
                Complete
              </Badge>
            )}
            {status === 'error' && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                Error
              </Badge>
            )}
          </div>
          <CardDescription>
            Paste any public SoundCloud track URL below
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleDownload} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="https://soundcloud.com/artist/track-name"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={status === 'downloading'}
                className="h-12 text-base"
              />
            </div>

            {status === 'downloading' && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{message}</span>
                  <span className="font-bold text-primary">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {status === 'completed' && trackInfo && (
              <div className="p-4 bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-green-900 dark:text-green-100">{trackInfo.title}</p>
                    <p className="text-sm text-green-700 dark:text-green-300">{trackInfo.artist}</p>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 bg-destructive/10 border-2 border-destructive/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive font-medium">{message}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {status === 'completed' ? (
                <>
                  <Button
                    type="button"
                    onClick={handleDownloadFile}
                    size="lg"
                    className="flex-1 h-12 text-base"
                  >
                    <Download className="w-5 h-5" />
                    Download MP3
                  </Button>
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                    size="lg"
                    className="h-12"
                  >
                    New Download
                  </Button>
                </>
              ) : (
                <Button
                  type="submit"
                  disabled={status === 'downloading'}
                  size="lg"
                  className="w-full h-12 text-base"
                >
                  {status === 'downloading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Track
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          High-quality 320kbps MP3 • Preserves metadata • Free & open source
        </p>
      </div>
    </div>
  )
}
