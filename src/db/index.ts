import mongoose from "mongoose"
import bcrypt from "bcryptjs"

let isConnected = false

export async function connectDatabase() {
  if (isConnected) return

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is required")
  }

  await mongoose.connect(process.env.MONGO_URI)
  isConnected = true
}

// Mongoose Schemas
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["manager", "cashier"], required: true },
    name: { type: String, required: true },
    branchId: { type: String },
  },
  { timestamps: true },
)

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // cents
    stock: { type: Number, required: true, default: 0 },
    barcode: { type: String },
    category: { type: String, required: true },
    branchId: { type: String, required: true },
  },
  { timestamps: true },
)

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    branchId: { type: String, required: true },
  },
  { timestamps: true },
)

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    branchId: { type: String, required: true },
  },
  { timestamps: true },
)

const saleSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: { type: String, required: true },
        sku: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, required: true },
    total: { type: Number, required: true },
    customerId: { type: String },
    cashierId: { type: String, required: true },
    branchId: { type: String, required: true },
    paymentMethod: { type: String, enum: ["cash", "card", "other"], required: true },
  },
  { timestamps: true },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Models
export const User = mongoose.models.User || mongoose.model("User", userSchema)
export const Product = mongoose.models.Product || mongoose.model("Product", productSchema)
export const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema)
export const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema)
export const Sale = mongoose.models.Sale || mongoose.model("Sale", saleSchema)
