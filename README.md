# POS Suite v0 - Complete Point of Sale System

A comprehensive, production-ready Point of Sale (POS) system built with Next.js 14, featuring a modern web interface and microservice architecture for thermal receipt printing.

## 🚀 Features

### Core POS Functionality
- **Real-time Sales Processing**: Fast checkout with barcode scanning support
- **Cart Management**: Hold/resume transactions, quantity adjustments, discounts
- **Payment Processing**: Cash transactions with change calculation
- **Receipt Printing**: ESC/POS thermal printer support via microservice

### Product & Inventory Management
- **Product CRUD**: Complete product lifecycle management
- **Barcode Support**: Automatic product lookup via barcode scanning
- **Bulk Import**: CSV/XLSX product import with validation
- **Stock Tracking**: Real-time inventory updates with low-stock alerts

### Customer Management
- **Customer Database**: Store customer information and purchase history
- **Quick Lookup**: Fast customer search during checkout
- **Purchase Tracking**: Complete transaction history per customer

### Reports & Analytics
- **Sales Reports**: Daily, weekly, monthly sales analysis
- **Product Performance**: Best-selling products and revenue analysis
- **Customer Insights**: Top customers and purchase patterns
- **Inventory Reports**: Low stock alerts and reorder recommendations

### User Management & Security
- **Role-Based Access**: Manager and Cashier roles with appropriate permissions
- **JWT Authentication**: Secure session management with HTTP-only cookies
- **Branch Support**: Multi-location support with branch-specific data

## 🏗️ Architecture

### Monorepo Structure
\`\`\`
pos-suite-v0/
├── app/                    # Next.js 14 App Router
├── components/             # React components
├── src/
│   ├── db/                # Database adapters (MongoDB, future: Prisma)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript definitions
├── print-server/          # Node.js microservice for printing
├── scripts/               # Database seeding and utilities
└── docker-compose.yml     # Complete deployment setup
\`\`\`

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js (print server)
- **Database**: MongoDB with Mongoose (extensible to other databases)
- **Authentication**: JWT with HTTP-only cookies
- **State Management**: Zustand for cart persistence
- **Charts**: Recharts for analytics visualization
- **Printing**: ESC/POS commands via TCP/IP

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Docker and Docker Compose (recommended)
- MongoDB (if not using Docker)

### Option 1: Docker Deployment (Recommended)

1. **Clone and configure**:
   \`\`\`bash
   git clone <repository-url>
   cd pos-suite-v0
   cp .env.example .env.local
   \`\`\`

2. **Update environment variables** in `docker-compose.yml`:
   \`\`\`yaml
   # Update these values for your setup
   - NEXT_PUBLIC_PRINTER_IP=192.168.1.100  # Your printer IP
   - NEXT_PUBLIC_STORE_NAME=Your Store Name
   - NEXT_PUBLIC_STORE_ADDRESS=Your Address
   \`\`\`

3. **Start all services**:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

4. **Access the application**:
   - POS System: http://localhost:3000
   - Print Server: http://localhost:3001
   - MongoDB: localhost:27017

### Option 2: Local Development

1. **Install dependencies**:
   \`\`\`bash
   npm install
   cd print-server && npm install && cd ..
   \`\`\`

2. **Set up environment variables**:
   \`\`\`bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   \`\`\`

3. **Start MongoDB** (if not using Docker):
   \`\`\`bash
   mongod --dbpath /path/to/your/db
   \`\`\`

4. **Seed the database**:
   \`\`\`bash
   npm run seed
   \`\`\`

5. **Start the applications**:
   \`\`\`bash
   # Terminal 1: Main POS app
   npm run dev

   # Terminal 2: Print server
   cd print-server && npm start
   \`\`\`

## 🔧 Configuration

### Environment Variables

Create `.env.local` with the following variables:

\`\`\`env
# Database Configuration
DB_ADAPTER=mongoose
MONGO_URI=mongodb://localhost:27017/pos_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Print Server Configuration
NEXT_PUBLIC_PRINT_ENABLED=true
NEXT_PUBLIC_PRINT_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_PRINTER_IP=192.168.1.100
NEXT_PUBLIC_PRINTER_PORT=9100

# Store Information
NEXT_PUBLIC_STORE_NAME=Your Store Name
NEXT_PUBLIC_STORE_ADDRESS=123 Main St, City, State 12345
NEXT_PUBLIC_STORE_PHONE=(555) 123-4567
NEXT_PUBLIC_RECEIPT_FOOTER=Thank you for your business!
\`\`\`

### Printer Setup

1. **Connect your ESC/POS thermal printer** to your network
2. **Configure the printer IP** in your environment variables
3. **Test the connection** using the settings page in the POS system
4. **Verify printing** with the test print function

## 📱 Usage Guide

### Default Login Credentials
- **Email**: admin@example.com
- **Password**: admin123

### Basic Workflow

1. **Login** with your credentials
2. **Add products** via the Products page or import CSV/XLSX
3. **Configure printer** in Settings (if using receipt printing)
4. **Start selling** on the POS page:
   - Scan barcodes or search products
   - Add items to cart
   - Apply discounts if needed
   - Complete sale and print receipt

### Barcode Scanning
- Use any USB barcode scanner configured as keyboard wedge
- Scanner input is automatically detected and processed
- Products are instantly added to cart when scanned

### Reports Access
- Navigate to Reports page for analytics
- View sales performance, top products, and customer insights
- Export data as CSV for external analysis

## 🔌 API Documentation

### Authentication Endpoints
\`\`\`
POST /api/auth/login     # User login
POST /api/auth/register  # User registration
POST /api/auth/logout    # User logout
GET  /api/auth/me        # Get current user
\`\`\`

### Product Management
\`\`\`
GET    /api/products              # List products with pagination
POST   /api/products              # Create new product
GET    /api/products/[id]         # Get product by ID
PUT    /api/products/[id]         # Update product
DELETE /api/products/[id]         # Delete product
GET    /api/products/barcode/[code] # Find product by barcode
POST   /api/products/import       # Bulk import products
\`\`\`

### Sales Processing
\`\`\`
POST /api/sales          # Create new sale
GET  /api/sales          # List sales with filters
GET  /api/sales/[id]     # Get sale details
\`\`\`

### Reports
\`\`\`
GET /api/reports/product-sales   # Product sales aggregation
GET /api/reports/daily-sales     # Daily sales totals
GET /api/reports/top-customers   # Customer ranking
GET /api/reports/low-stock       # Low inventory alerts
\`\`\`

### Print Server
\`\`\`
POST /print/receipt      # Send receipt to thermal printer
GET  /health            # Print server health check
\`\`\`

## 🛠️ Development

### Adding New Features

1. **Database Models**: Extend `src/types/index.ts` and database adapters
2. **API Routes**: Add new endpoints in `app/api/`
3. **UI Components**: Create reusable components in `components/`
4. **Pages**: Add new pages in `app/` following App Router conventions

### Database Adapters

The system supports multiple database backends:
- **MongoDB** (default): Full-featured with Mongoose
- **Prisma**: Ready for PostgreSQL/MySQL (implement `src/db/prisma-adapter.ts`)
- **Custom**: Implement the `DatabaseAdapter` interface

### Testing Printer Integration

\`\`\`bash
# Test receipt printing
curl -X POST http://localhost:3001/print/receipt \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.100",
    "port": 9100,
    "payload": {
      "storeName": "Test Store",
      "items": [{"name": "Test Item", "price": 1000, "quantity": 1}],
      "total": 1000
    }
  }'
\`\`\`

## 🚀 Deployment

### Production Deployment

1. **Update environment variables** for production
2. **Build and deploy** using Docker Compose:
   \`\`\`bash
   docker-compose -f docker-compose.yml up -d
   \`\`\`

3. **Set up reverse proxy** (nginx/Apache) for SSL termination
4. **Configure backups** for MongoDB data
5. **Monitor logs** and system performance

### Scaling Considerations

- **Database**: Consider MongoDB Atlas or replica sets for high availability
- **Print Server**: Deploy multiple instances behind load balancer if needed
- **Caching**: Add Redis for session storage and caching
- **CDN**: Use CDN for static assets in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API documentation above

## 🔄 Changelog

### v1.0.0
- Initial release with complete POS functionality
- MongoDB integration with Mongoose
- ESC/POS thermal printing support
- Comprehensive reporting and analytics
- Docker deployment configuration
- Role-based user management
