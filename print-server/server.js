const express = require("express")
const cors = require("cors")
const net = require("net")

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "pos-print-server", timestamp: new Date().toISOString() })
})

// Print receipt endpoint
app.post("/print/receipt", async (req, res) => {
  try {
    const { ip, port = 9100, payload } = req.body

    // Validate required fields
    if (!ip || !payload) {
      return res.status(400).json({
        error: "Missing required fields: ip and payload are required",
      })
    }

    // Validate IP address format (basic validation)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipRegex.test(ip)) {
      return res.status(400).json({
        error: "Invalid IP address format",
      })
    }

    // Validate port
    if (port < 1 || port > 65535) {
      return res.status(400).json({
        error: "Invalid port number. Must be between 1 and 65535",
      })
    }

    console.log(`Attempting to print to ${ip}:${port}`)

    // Create socket connection to printer
    const socket = new net.Socket()

    // Set connection timeout
    socket.setTimeout(5000)

    // Promise-based socket connection
    const printResult = await new Promise((resolve, reject) => {
      let connected = false

      socket.connect(port, ip, () => {
        connected = true
        console.log(`Connected to printer at ${ip}:${port}`)

        // Convert payload to ESC/POS commands
        const escPosData = generateESCPOSCommands(payload)

        // Send data to printer
        socket.write(escPosData, (err) => {
          if (err) {
            reject(new Error(`Failed to send data to printer: ${err.message}`))
          } else {
            console.log("Data sent to printer successfully")
            resolve({ success: true, message: "Receipt printed successfully" })
          }
        })
      })

      socket.on("error", (err) => {
        console.error(`Printer connection error: ${err.message}`)
        if (!connected) {
          reject(new Error(`Cannot connect to printer at ${ip}:${port}. ${err.message}`))
        } else {
          reject(new Error(`Printer error: ${err.message}`))
        }
      })

      socket.on("timeout", () => {
        console.error("Printer connection timeout")
        reject(new Error(`Connection timeout to printer at ${ip}:${port}`))
      })

      socket.on("close", () => {
        console.log("Printer connection closed")
        if (connected) {
          resolve({ success: true, message: "Receipt printed successfully" })
        }
      })
    })

    // Close socket
    socket.destroy()

    res.json(printResult)
  } catch (error) {
    console.error("Print error:", error)
    res.status(500).json({
      error: error.message || "Failed to print receipt",
    })
  }
})

// Generate ESC/POS commands from receipt payload
function generateESCPOSCommands(payload) {
  const ESC = "\x1B"
  const GS = "\x1D"

  let commands = ""

  // Initialize printer
  commands += ESC + "@" // Initialize
  commands += ESC + "a" + "\x01" // Center alignment

  // Store header
  if (payload.storeName) {
    commands += ESC + "!" + "\x18" // Double height and width
    commands += payload.storeName + "\n"
    commands += ESC + "!" + "\x00" // Reset text size
  }

  if (payload.storeAddress) {
    commands += payload.storeAddress + "\n"
  }

  if (payload.storePhone) {
    commands += payload.storePhone + "\n"
  }

  commands += "\n"

  // Receipt header
  commands += ESC + "a" + "\x00" // Left alignment
  commands += "Receipt #: " + (payload.receiptNumber || "N/A") + "\n"
  commands += "Date: " + (payload.date || new Date().toLocaleString()) + "\n"
  commands += "Cashier: " + (payload.cashier || "N/A") + "\n"

  if (payload.customer) {
    commands += "Customer: " + payload.customer + "\n"
  }

  commands += "\n"

  // Separator line
  commands += "--------------------------------\n"

  // Items
  if (payload.items && payload.items.length > 0) {
    payload.items.forEach((item) => {
      const name = item.name || "Unknown Item"
      const qty = item.quantity || 1
      const price = item.price || 0
      const total = item.total || qty * price

      // Item name
      commands += name + "\n"

      // Quantity x Price = Total (right aligned)
      const qtyPriceTotal = `${qty} x $${(price / 100).toFixed(2)} = $${(total / 100).toFixed(2)}`
      const spaces = Math.max(0, 32 - qtyPriceTotal.length)
      commands += " ".repeat(spaces) + qtyPriceTotal + "\n"
    })
  }

  commands += "--------------------------------\n"

  // Totals
  if (payload.subtotal !== undefined) {
    const subtotalLine = `Subtotal: $${(payload.subtotal / 100).toFixed(2)}`
    const spaces = Math.max(0, 32 - subtotalLine.length)
    commands += " ".repeat(spaces) + subtotalLine + "\n"
  }

  if (payload.discount && payload.discount > 0) {
    const discountLine = `Discount: -$${(payload.discount / 100).toFixed(2)}`
    const spaces = Math.max(0, 32 - discountLine.length)
    commands += " ".repeat(spaces) + discountLine + "\n"
  }

  if (payload.tax && payload.tax > 0) {
    const taxLine = `Tax: $${(payload.tax / 100).toFixed(2)}`
    const spaces = Math.max(0, 32 - taxLine.length)
    commands += " ".repeat(spaces) + taxLine + "\n"
  }

  if (payload.total !== undefined) {
    commands += "--------------------------------\n"
    const totalLine = `TOTAL: $${(payload.total / 100).toFixed(2)}`
    const spaces = Math.max(0, 32 - totalLine.length)
    commands += ESC + "!" + "\x08" // Bold
    commands += " ".repeat(spaces) + totalLine + "\n"
    commands += ESC + "!" + "\x00" // Reset
  }

  if (payload.paymentMethod) {
    commands += `Payment: ${payload.paymentMethod.toUpperCase()}\n`
  }

  commands += "\n"

  // Footer
  commands += ESC + "a" + "\x01" // Center alignment
  commands += "Thank you for your business!\n"

  if (payload.footer) {
    commands += payload.footer + "\n"
  }

  commands += "\n\n"

  // Cut paper (if supported)
  commands += GS + "V" + "\x42" + "\x00" // Partial cut

  return Buffer.from(commands, "ascii")
}

// Test endpoint for development
app.post("/print/test", (req, res) => {
  const testPayload = {
    storeName: "POS Suite Demo Store",
    storeAddress: "123 Main Street, City, State 12345",
    storePhone: "(555) 123-4567",
    receiptNumber: "TEST-001",
    date: new Date().toLocaleString(),
    cashier: "Test Cashier",
    items: [
      {
        name: "Test Coffee",
        quantity: 2,
        price: 350, // $3.50 in cents
        total: 700,
      },
      {
        name: "Test Sandwich",
        quantity: 1,
        price: 750, // $7.50 in cents
        total: 750,
      },
    ],
    subtotal: 1450,
    tax: 145,
    total: 1595,
    paymentMethod: "cash",
  }

  const { ip, port = 9100 } = req.body

  if (!ip) {
    return res.status(400).json({
      error: "IP address is required for test print",
    })
  }

  // Use the same print logic
  req.body.payload = testPayload

  // Forward to the main print endpoint
  app._router.handle({ ...req, url: "/print/receipt", method: "POST" }, res)
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: ["GET /health", "POST /print/receipt", "POST /print/test"],
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`POS Print Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`Print endpoint: POST http://localhost:${PORT}/print/receipt`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully")
  process.exit(0)
})
