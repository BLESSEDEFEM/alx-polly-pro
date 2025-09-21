'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { QrCode, Download, Share2, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface QRCodeGeneratorProps {
  pollId: string
  pollTitle: string
  className?: string
}

export function QRCodeGenerator({ pollId, pollTitle, className }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const pollUrl = `${window.location.origin}/polls/${pollId}`

  const generateQRCode = async () => {
    setIsLoading(true)
    try {
      const qrDataUrl = await QRCode.toDataURL(pollUrl, {
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
    if (isOpen && !qrCodeUrl) {
      generateQRCode()
    }
  }, [isOpen, qrCodeUrl])

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
      await navigator.clipboard.writeText(pollUrl)
      toast.success('Poll URL copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy URL:', error)
      toast.error('Failed to copy URL')
    }
  }

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Poll: ${pollTitle}`,
          text: `Check out this poll: ${pollTitle}`,
          url: pollUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
        // Fallback to copying URL
        copyPollUrl()
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      copyPollUrl()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <QrCode className="h-4 w-4 mr-2" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[95vw] mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
            Share Poll QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground line-clamp-2">
                {pollTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {/* Poll URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Poll URL:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pollUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border min-w-0 truncate"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPollUrl}
                    className="flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
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
                  onClick={shareQRCode}
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-xs text-muted-foreground text-center px-2">
                Scan this QR code with any device to quickly access the poll
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}