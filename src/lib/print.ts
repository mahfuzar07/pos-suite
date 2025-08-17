// Print service for POS Suite
export interface PrintPayload {
  storeName?: string
  storeAddress?: string
  storePhone?: string
  receiptNumber?: string
  date?: string
  cashier?: string
  customer?: string
  items: Array<{
    name: string
    quantity: number
    price: number // in cents
    total: number // in cents
  }>
  subtotal: number // in cents
  discount?: number // in cents
  tax?: number // in cents
  total: number // in cents
  paymentMethod: string
  footer?: string
}

export interface PrintConfig {
  enabled: boolean
  serverUrl: string
  printerIp: string
  printerPort: number
  storeName?: string
  storeAddress?: string
  storePhone?: string
  footer?: string
}

class PrintService {
  private config: PrintConfig

  constructor() {
    // Load configuration from environment variables or defaults
    this.config = {
      enabled: process.env.NEXT_PUBLIC_PRINT_ENABLED === "true",
      serverUrl: process.env.NEXT_PUBLIC_PRINT_SERVER_URL || "http://localhost:3001",
      printerIp: process.env.NEXT_PUBLIC_PRINTER_IP || "192.168.1.100",
      printerPort: Number(process.env.NEXT_PUBLIC_PRINTER_PORT) || 9100,
      storeName: process.env.NEXT_PUBLIC_STORE_NAME || "POS Suite Store",
      storeAddress: process.env.NEXT_PUBLIC_STORE_ADDRESS || "",
      storePhone: process.env.NEXT_PUBLIC_STORE_PHONE || "",
      footer: process.env.NEXT_PUBLIC_RECEIPT_FOOTER || "Thank you for your business!",
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<PrintConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  // Get current configuration
  getConfig(): PrintConfig {
    return { ...this.config }
  }

  // Check if printing is enabled and configured
  isEnabled(): boolean {
    return this.config.enabled && !!this.config.serverUrl && !!this.config.printerIp
  }

  // Print receipt
  async printReceipt(saleData: any, receiptNumber?: string): Promise<boolean> {
    if (!this.isEnabled()) {
      console.log("Printing is disabled or not configured")
      return false
    }

    try {
      const payload: PrintPayload = {
        storeName: this.config.storeName,
        storeAddress: this.config.storeAddress,
        storePhone: this.config.storePhone,
        receiptNumber: receiptNumber || `RCP-${Date.now()}`,
        date: new Date().toLocaleString(),
        cashier: saleData.cashierName || "Cashier",
        customer: saleData.customerName,
        items: saleData.items || [],
        subtotal: saleData.subtotal || 0,
        discount: saleData.discount || 0,
        tax: saleData.tax || 0,
        total: saleData.total || 0,
        paymentMethod: saleData.paymentMethod || "cash",
        footer: this.config.footer,
      }

      const response = await fetch(`${this.config.serverUrl}/print/receipt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip: this.config.printerIp,
          port: this.config.printerPort,
          payload,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Print request failed")
      }

      const result = await response.json()
      console.log("Receipt printed successfully:", result.message)
      return true
    } catch (error) {
      console.error("Print error:", error)
      throw new Error(error instanceof Error ? error.message : "Failed to print receipt")
    }
  }

  // Test printer connection
  async testPrint(): Promise<boolean> {
    if (!this.isEnabled()) {
      throw new Error("Printing is disabled or not configured")
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/print/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip: this.config.printerIp,
          port: this.config.printerPort,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Test print failed")
      }

      const result = await response.json()
      console.log("Test print successful:", result.message)
      return true
    } catch (error) {
      console.error("Test print error:", error)
      throw new Error(error instanceof Error ? error.message : "Test print failed")
    }
  }

  // Check print server health
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.serverUrl}/health`, {
        method: "GET",
      })

      return response.ok
    } catch (error) {
      console.error("Print server health check failed:", error)
      return false
    }
  }
}

// Export singleton instance
export const printService = new PrintService()

// Export types and service
export default printService
