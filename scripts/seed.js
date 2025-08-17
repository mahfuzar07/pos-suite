const mongoose = require("mongoose")
require("dotenv").config()

// Simple schemas for seeding (without the full app structure)
const userSchema = new mongoose.Schema(
  {
    email: String,
    password: String,
    role: String,
    name: String,
    branchId: String,
  },
  { timestamps: true },
)

const productSchema = new mongoose.Schema(
  {
    sku: String,
    name: String,
    price: Number,
    stock: Number,
    barcode: String,
    category: String,
    branchId: String,
  },
  { timestamps: true },
)

const customerSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    address: String,
    branchId: String,
  },
  { timestamps: true },
)

const saleSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        sku: String,
        name: String,
        price: Number,
        quantity: Number,
        total: Number,
      },
    ],
    subtotal: Number,
    tax: Number,
    discount: Number,
    total: Number,
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    branchId: String,
    paymentMethod: String,
  },
  { timestamps: true },
)

const User = mongoose.model("User", userSchema)
const Product = mongoose.model("Product", productSchema)
const Customer = mongoose.model("Customer", customerSchema)
const Sale = mongoose.model("Sale", saleSchema)

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/pos-suite")

    console.log("Connected to MongoDB")

    // Clear existing data
    await User.deleteMany({})
    await Product.deleteMany({})
    await Customer.deleteMany({})
    await Sale.deleteMany({})

    console.log("Cleared existing data")

    // Create admin user (password will be hashed by the pre-save hook)
    const bcrypt = require("bcryptjs")
    const adminPassword = await bcrypt.hash("admin123", 12)

    await User.create({
      email: "admin@example.com",
      password: adminPassword,
      role: "manager",
      name: "Admin User",
      branchId: "default",
    })

    console.log("Created admin user: admin@example.com / admin123")

    // Create sample products
    const sampleProducts = [
      {
        sku: "PROD001",
        name: "Coffee",
        price: 350,
        stock: 100,
        barcode: "1234567890123",
        category: "Beverages",
        branchId: "default",
      },
      {
        sku: "PROD002",
        name: "Sandwich",
        price: 750,
        stock: 50,
        barcode: "1234567890124",
        category: "Food",
        branchId: "default",
      },
      {
        sku: "PROD003",
        name: "Water Bottle",
        price: 150,
        stock: 200,
        barcode: "1234567890125",
        category: "Beverages",
        branchId: "default",
      },
      {
        sku: "PROD004",
        name: "Chips",
        price: 200,
        stock: 75,
        barcode: "1234567890126",
        category: "Snacks",
        branchId: "default",
      },
      {
        sku: "PROD005",
        name: "Energy Drink",
        price: 300,
        stock: 30,
        barcode: "1234567890127",
        category: "Beverages",
        branchId: "default",
      },
    ]

    await Product.insertMany(sampleProducts)
    console.log("Created sample products")

    // Create sample customers
    const sampleCustomers = [
      { name: "John Doe", email: "john@example.com", phone: "555-0101", address: "123 Main St", branchId: "default" },
      { name: "Jane Smith", email: "jane@example.com", phone: "555-0102", address: "456 Oak Ave", branchId: "default" },
      { name: "Bob Johnson", email: "bob@example.com", phone: "555-0103", address: "789 Pine Rd", branchId: "default" },
    ]

    await Customer.insertMany(sampleCustomers)
    console.log("Created sample customers")

    const createdProducts = await Product.find({})
    const createdCustomers = await Customer.find({})
    const createdUser = await User.findOne({ email: "admin@example.com" })

    const sampleSales = []
    const today = new Date()

    // Create sales for the last 30 days
    for (let i = 0; i < 30; i++) {
      const saleDate = new Date(today)
      saleDate.setDate(today.getDate() - i)

      // Create 1-3 sales per day
      const salesPerDay = Math.floor(Math.random() * 3) + 1

      for (let j = 0; j < salesPerDay; j++) {
        const randomProducts = createdProducts
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 3) + 1)

        const items = randomProducts.map((product) => {
          const quantity = Math.floor(Math.random() * 5) + 1
          return {
            productId: product._id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            quantity,
            total: product.price * quantity,
          }
        })

        const subtotal = items.reduce((sum, item) => sum + item.total, 0)
        const tax = Math.floor(subtotal * 0.1)
        const discount = Math.floor(Math.random() * 100)
        const total = subtotal + tax - discount

        const sale = {
          items,
          subtotal,
          tax,
          discount,
          total,
          customerId: createdCustomers[Math.floor(Math.random() * createdCustomers.length)]._id,
          userId: createdUser._id,
          branchId: "default",
          paymentMethod: ["cash", "card", "mobile"][Math.floor(Math.random() * 3)],
          createdAt: saleDate,
          updatedAt: saleDate,
        }

        sampleSales.push(sale)
      }
    }

    await Sale.insertMany(sampleSales)
    console.log(`Created ${sampleSales.length} sample sales`)

    console.log("Seed completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Seed failed:", error)
    process.exit(1)
  }
}

seed()
