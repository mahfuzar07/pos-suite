# POS Print Server

A Node.js microservice for sending ESC/POS commands to network thermal printers.

## Features

- Send receipt data to ESC/POS compatible thermal printers over TCP/IP
- Automatic ESC/POS command generation from JSON payload
- Support for standard receipt formatting (header, items, totals, footer)
- Connection timeout and error handling
- Health check endpoint
- Docker support

## Installation

\`\`\`bash
cd print-server
npm install
\`\`\`

## Usage

### Start the server

\`\`\`bash
npm start
\`\`\`

The server will start on port 3001 by default.

### Environment Variables

- `PORT` - Server port (default: 3001)

## API Endpoints

### Health Check

\`\`\`bash
GET /health
\`\`\`

Returns server status and timestamp.

### Print Receipt

\`\`\`bash
POST /print/receipt
\`\`\`

**Request Body:**
\`\`\`json
{
  "ip": "192.168.1.100",
  "port": 9100,
  "payload": {
    "storeName": "My Store",
    "storeAddress": "123 Main St, City, State 12345",
    "storePhone": "(555) 123-4567",
    "receiptNumber": "RCP-001",
    "date": "2024-01-15 14:30:00",
    "cashier": "John Doe",
    "customer": "Jane Smith",
    "items": [
      {
        "name": "Coffee",
        "quantity": 2,
        "price": 350,
        "total": 700
      },
      {
        "name": "Sandwich",
        "quantity": 1,
        "price": 750,
        "total": 750
      }
    ],
    "subtotal": 1450,
    "discount": 0,
    "tax": 145,
    "total": 1595,
    "paymentMethod": "cash",
    "footer": "Visit us again!"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Receipt printed successfully"
}
\`\`\`

### Test Print

\`\`\`bash
POST /print/test
\`\`\`

**Request Body:**
\`\`\`json
{
  "ip": "192.168.1.100",
  "port": 9100
}
\`\`\`

Sends a test receipt to the specified printer.

## Example cURL Commands

### Print a receipt

\`\`\`bash
curl -X POST http://localhost:3001/print/receipt \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.100",
    "port": 9100,
    "payload": {
      "storeName": "Demo Store",
      "receiptNumber": "001",
      "items": [
        {
          "name": "Coffee",
          "quantity": 1,
          "price": 350,
          "total": 350
        }
      ],
      "subtotal": 350,
      "tax": 35,
      "total": 385,
      "paymentMethod": "cash"
    }
  }'
\`\`\`

### Test print

\`\`\`bash
curl -X POST http://localhost:3001/print/test \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.100"
  }'
\`\`\`

### Health check

\`\`\`bash
curl http://localhost:3001/health
\`\`\`

## ESC/POS Commands Generated

The server automatically converts JSON payload to ESC/POS commands:

- **Initialize**: `ESC @`
- **Text alignment**: `ESC a`
- **Text size**: `ESC !`
- **Bold text**: `ESC !` with bold flag
- **Paper cut**: `GS V`

## Printer Compatibility

This server works with ESC/POS compatible thermal printers that support:
- TCP/IP network connection (usually port 9100)
- Standard ESC/POS command set
- 32-character line width (adjustable in code)

## Common Printer Brands

- Epson TM series
- Star Micronics
- Citizen
- Bixolon
- And many others supporting ESC/POS

## Troubleshooting

### Connection Issues

1. **Check printer IP and port**: Ensure the printer is accessible on the network
2. **Firewall**: Make sure port 9100 (or your printer's port) is not blocked
3. **Printer settings**: Verify the printer's network settings and ESC/POS mode

### Common Error Messages

- `Cannot connect to printer`: Check IP address and network connectivity
- `Connection timeout`: Printer may be offline or unreachable
- `Invalid IP address format`: Ensure IP is in correct format (e.g., 192.168.1.100)

## Docker Usage

### Build image

\`\`\`bash
docker build -t pos-print-server .
\`\`\`

### Run container

\`\`\`bash
docker run -p 3001:3001 pos-print-server
\`\`\`

## Development

### Start in development mode

\`\`\`bash
npm run dev
\`\`\`

This uses nodemon for automatic restarts on file changes.

## License

MIT
