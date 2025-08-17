"use client"

import { useEffect, useRef } from "react"

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void
  minLength?: number
  timeout?: number
}

export function useBarcodeScanner({ onScan, minLength = 8, timeout = 100 }: BarcodeScannerOptions) {
  const bufferRef = useRef("")
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Handle Enter key (end of barcode scan)
      if (event.key === "Enter") {
        if (bufferRef.current.length >= minLength) {
          onScan(bufferRef.current)
        }
        bufferRef.current = ""
        return
      }

      // Add character to buffer
      if (event.key.length === 1) {
        bufferRef.current += event.key

        // Set timeout to clear buffer if no more input
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = ""
        }, timeout)
      }
    }

    document.addEventListener("keypress", handleKeyPress)

    return () => {
      document.removeEventListener("keypress", handleKeyPress)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [onScan, minLength, timeout])
}
