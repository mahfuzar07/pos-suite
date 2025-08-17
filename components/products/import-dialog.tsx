"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Download, FileSpreadsheet } from "lucide-react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Alert, AlertDescription } from "../ui/alert"
import { Progress } from "../ui/progress"

interface ImportDialogProps {
  onImportComplete: () => void
}

export function ImportDialog({ onImportComplete }: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResults(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Import failed")
      }

      setResults(data.results)
      onImportComplete()
    } catch (error) {
      setResults({
        success: 0,
        errors: [error instanceof Error ? error.message : "Import failed"],
        total: 0,
      })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `sku,name,price,stock,barcode,category
PROD001,Coffee,3.50,100,1234567890123,Beverages
PROD002,Sandwich,7.50,50,1234567890124,Food
PROD003,Water Bottle,1.50,200,1234567890125,Beverages`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "products_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const resetDialog = () => {
    setFile(null)
    setResults(null)
    setImporting(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetDialog()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Products
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Products
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!results && (
            <>
              <div className="space-y-2">
                <Label htmlFor="file">Select CSV or Excel file</Label>
                <Input id="file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
                <p className="text-xs text-gray-600">
                  Supported formats: CSV, Excel (.xlsx, .xls)
                  <br />
                  Required columns: sku, name, price, stock, category
                  <br />
                  Optional columns: barcode
                </p>
              </div>

              <Button variant="outline" onClick={downloadTemplate} className="w-full bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>

              {importing && (
                <div className="space-y-2">
                  <Progress value={50} />
                  <p className="text-sm text-center">Importing products...</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={!file || importing} className="flex-1">
                  {importing ? "Importing..." : "Import"}
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}

          {results && (
            <div className="space-y-4">
              <Alert variant={results.errors.length > 0 ? "destructive" : "default"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>
                      <strong>Import Results:</strong>
                    </p>
                    <p>✅ {results.success} products imported successfully</p>
                    <p>❌ {results.errors.length} errors</p>
                    <p>📊 {results.total} total rows processed</p>
                  </div>
                </AlertDescription>
              </Alert>

              {results.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">Errors:</p>
                  <ul className="text-xs space-y-1">
                    {results.errors.slice(0, 10).map((error: string, index: number) => (
                      <li key={index} className="text-red-600">
                        • {error}
                      </li>
                    ))}
                    {results.errors.length > 10 && (
                      <li className="text-gray-500">... and {results.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              <Button onClick={() => setIsOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
