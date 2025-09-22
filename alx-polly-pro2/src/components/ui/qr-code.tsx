"use client"

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from './button'
import { Download, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QRCodeProps {
  value: string
  size?: number
  className?: string
  showActions?: boolean
}

export function QRCodeComponent({ 
  value, 
  size = 200, 
  className,
  showActions = true 
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current || !value) return
      
      try {
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setError(null)
      } catch (err) {
        setError('Failed to generate QR code')
        console.error('QR Code generation error:', err)
      }
    }

    generateQR()
  }, [value, size])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleDownload = () => {
    if (!canvasRef.current) return
    
    const link = document.createElement('a')
    link.download = 'poll-qr-code.png'
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center p-4 border border-red-200 rounded-lg", className)}>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="p-4 bg-white rounded-lg border">
        <canvas 
          ref={canvasRef}
          className="block"
        />
      </div>
      
      {showActions && (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex items-center space-x-2"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      )}
    </div>
  )
}