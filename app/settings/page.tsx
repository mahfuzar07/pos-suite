"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Printer, TestTube, Save } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Checkbox } from "../../components/ui/checkbox"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Separator } from "../../components/ui/separator"
import printService, { type PrintConfig } from "../../src/lib/print"

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<PrintConfig>(printService.getConfig())
  const [testingPrint, setTestingPrint] = useState(false)
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          router.push("/login")
        }
      } catch (error) {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Check print server health
  useEffect(() => {
    const checkHealth = async () => {
      if (config.enabled && config.serverUrl) {
        const healthy = await printService.checkServerHealth()
        setServerHealthy(healthy)
      }
    }

    checkHealth()
  }, [config.enabled, config.serverUrl])

  const handleConfigChange = (field: keyof PrintConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    try {
      printService.updateConfig(config)
      setMessage({ type: "success", text: "Settings saved successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleTestPrint = async () => {
    setTestingPrint(true)
    setMessage(null)

    try {
      // Update service config first
      printService.updateConfig(config)

      await printService.testPrint()
      setMessage({ type: "success", text: "Test print sent successfully!" })
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Test print failed",
      })
    } finally {
      setTestingPrint(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/pos")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to POS
              </Button>
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.name} ({user.role})
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Print Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Print Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Printing */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="printEnabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => handleConfigChange("enabled", checked)}
                />
                <Label htmlFor="printEnabled">Enable receipt printing</Label>
              </div>

              {config.enabled && (
                <>
                  <Separator />

                  {/* Print Server Configuration */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Print Server Configuration</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="serverUrl">Print Server URL</Label>
                        <Input
                          id="serverUrl"
                          value={config.serverUrl}
                          onChange={(e) => handleConfigChange("serverUrl", e.target.value)}
                          placeholder="http://localhost:3001"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="printerIp">Printer IP Address</Label>
                        <Input
                          id="printerIp"
                          value={config.printerIp}
                          onChange={(e) => handleConfigChange("printerIp", e.target.value)}
                          placeholder="192.168.1.100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="printerPort">Printer Port</Label>
                      <Input
                        id="printerPort"
                        type="number"
                        value={config.printerPort}
                        onChange={(e) => handleConfigChange("printerPort", Number.parseInt(e.target.value) || 9100)}
                        placeholder="9100"
                        className="w-32"
                      />
                    </div>

                    {/* Server Health Status */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Print Server Status:</span>
                      {serverHealthy === null ? (
                        <span className="text-gray-500">Checking...</span>
                      ) : serverHealthy ? (
                        <span className="text-green-600">✓ Online</span>
                      ) : (
                        <span className="text-red-600">✗ Offline</span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Store Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Store Information (appears on receipts)</h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input
                          id="storeName"
                          value={config.storeName || ""}
                          onChange={(e) => handleConfigChange("storeName", e.target.value)}
                          placeholder="My Store"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storeAddress">Store Address</Label>
                        <Input
                          id="storeAddress"
                          value={config.storeAddress || ""}
                          onChange={(e) => handleConfigChange("storeAddress", e.target.value)}
                          placeholder="123 Main St, City, State 12345"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storePhone">Store Phone</Label>
                        <Input
                          id="storePhone"
                          value={config.storePhone || ""}
                          onChange={(e) => handleConfigChange("storePhone", e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="footer">Receipt Footer</Label>
                        <Input
                          id="footer"
                          value={config.footer || ""}
                          onChange={(e) => handleConfigChange("footer", e.target.value)}
                          placeholder="Thank you for your business!"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Test Print */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Test Printer</h3>
                    <p className="text-sm text-gray-600">Send a test receipt to verify your printer configuration.</p>

                    <Button onClick={handleTestPrint} disabled={testingPrint || !config.printerIp} variant="outline">
                      <TestTube className="h-4 w-4 mr-2" />
                      {testingPrint ? "Sending Test Print..." : "Send Test Print"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
