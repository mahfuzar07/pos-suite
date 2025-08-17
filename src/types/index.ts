export interface User {
  _id?: string
  email: string
  password: string
  role: "manager" | "cashier"
  name: string
  branchId?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Product {
  _id?: string
  sku: string
  name: string
  price: number // stored in cents
  stock: number
  barcode?: string
  category: string
  branchId: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Customer {
  _id?: string
  name: string
  email?: string
  phone?: string
  address?: string
  branchId: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Vendor {
  _id?: string
  name: string
  email?: string
  phone?: string
  address?: string
  branchId: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Sale {
  _id?: string
  items: SaleItem[]
  subtotal: number // in cents
  tax: number // in cents
  discount: number // in cents
  total: number // in cents
  customerId?: string
  cashierId: string
  branchId: string
  paymentMethod: "cash" | "card" | "other"
  createdAt?: Date
}

export interface SaleItem {
  productId: string
  sku: string
  name: string
  price: number // in cents
  quantity: number
  total: number // in cents
}

export interface CartItem {
  productId: string
  sku: string
  name: string
  price: number
  quantity: number
  stock: number
}
