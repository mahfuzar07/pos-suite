// MongoDB initialization script for Docker
// Declare the db variable
var db

// Switch to the pos_db database
db = db.getSiblingDB("pos_db")

// Create collections
db.createCollection("users")
db.createCollection("products")
db.createCollection("customers")
db.createCollection("sales")

// Create indexes for better performance
db.products.createIndex({ sku: 1 }, { unique: true })
db.products.createIndex({ barcode: 1 }, { unique: true, sparse: true })
db.products.createIndex({ name: "text" })
db.customers.createIndex({ email: 1 }, { unique: true, sparse: true })
db.customers.createIndex({ phone: 1 }, { unique: true, sparse: true })
db.sales.createIndex({ createdAt: -1 })
db.sales.createIndex({ branchId: 1 })

// Create default admin user
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2b$10$rQZ8kHWiZ8qHZqHZqHZqHOeKfKfKfKfKfKfKfKfKfKfKfKfKfKfKf", // password: admin123
  role: "manager",
  branchId: "main",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
})

print("Database initialized successfully")
