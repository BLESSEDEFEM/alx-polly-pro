'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { QrCode, Download, Share2, Copy, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

interface NetworkQRProps {
  pollId: string
  pollTitle: string
  className?: string
}

export function NetworkQR({ pollId, pollTitle, className }: NetworkQRProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [networkUrl, setNetworkUrl] = useState('')

  // Get the base path without hostname
  const pollPath = `/polls/${pollId}`

  useEffect(() => {
    // Try to get the user's local IP address
    if (isOpen && !networkUrl) {
      setNetworkUrl(`${window.location.protocol}//${window.location.hostname}:${window.location.port}${pollPath}`)
    }
  }, [isOpen, networkUrl, pollPath])

  const generateQRCode = async () => {
    if (!networkUrl) return
    
    setIsLoading(true)
    try {
      const qrDataUrl = await QRCode.toDataURL(networkUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      setQrCodeUrl(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && networkUrl && !qrCodeUrl) {
      generateQRCode()
    }
  }, [isOpen, networkUrl, qrCodeUrl])

  const downloadQRCode = () => {
    if (!qrCodeUrl) return

    const link = document.createElement('a')
    link.download = `poll-${pollId}-qr-code.png`
    link.href = qrCodeUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('QR code downloaded successfully!')
  }

  const copyPollUrl = async () => {
    try {
      await navigator.clipboard.writeText(networkUrl)
      toast.success('Poll URL copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy URL:', error)
      toast.error('Failed to copy URL')
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNetworkUrl(e.target.value)
    setQrCodeUrl('') // Reset QR code when URL changes
  }

  const regenerateQRCode = () => {
    setQrCodeUrl('')
    generateQRCode()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Globe className="h-4 w-4 mr-2" />
          Network QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[95vw] mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
            Share Poll on Your Network
          </DialogTitle>
          <DialogDescription>
            Generate a QR code that works on your local network
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground line-clamp-2">
                {pollTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Network URL Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Network URL:</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={networkUrl}
                    onChange={handleUrlChange}
                    placeholder="Enter your network URL (e.g., http://192.168.1.100:3001/polls/...)"
                    className="flex-1 px-3 py-2 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={regenerateQRCode}
                    className="flex-shrink-0"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Replace with your actual network IP and port for sharing on your local network
                </p>
              </div>

              {/* QR Code Display */}
              <div className="flex justify-center">
                {isLoading ? (
                  <div className="w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] bg-muted rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt={`QR Code for ${pollTitle}`}
                    className="rounded-lg border max-w-full h-auto"
                    width={300}
                    height={300}
                  />
                ) : (
                  <div className="w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] bg-muted rounded-lg flex items-center justify-center">
                    <QrCode className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={downloadQRCode}
                  disabled={!qrCodeUrl}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={copyPollUrl}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-xs text-muted-foreground text-center px-2">
                <p>For sharing on your local network:</p>
                <ol className="text-left list-decimal pl-4 mt-1 space-y-1">
                  <li>Find your computer's IP address (e.g., 192.168.1.100)</li>
                  <li>Enter it with the port in the URL field above</li>
                  <li>Generate and share the QR code</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}