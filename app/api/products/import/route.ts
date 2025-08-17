import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { connectDatabase, Product } from "../../../../src/db"
import { getCurrentUser } from "../../../../src/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "manager") {
      return NextResponse.json({ error: "Manager role required" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Please upload CSV or Excel file." }, { status: 400 })
    }

    // Read file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "File is empty or invalid" }, { status: 400 })
    }

    await connectDatabase()
    const results = {
      success: 0,
      errors: [] as string[],
      total: data.length,
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any
      const rowNum = i + 2 // Excel row number (accounting for header)

      try {
        // Map common column names (case insensitive)
        const sku = row.sku || row.SKU || row.Sku || row["Product Code"] || row["product_code"]
        const name = row.name || row.Name || row.NAME || row["Product Name"] || row["product_name"]
        const price = row.price || row.Price || row.PRICE || row.cost || row.Cost
        const stock = row.stock || row.Stock || row.STOCK || row.quantity || row.Quantity || row.qty
        const barcode = row.barcode || row.Barcode || row.BARCODE || row.upc || row.UPC
        const category = row.category || row.Category || row.CATEGORY || row.type || row.Type

        // Validate required fields
        if (!sku || !name || price === undefined || stock === undefined || !category) {
          results.errors.push(`Row ${rowNum}: Missing required fields (sku, name, price, stock, category)`)
          continue
        }

        // Convert and validate price (assume dollars, convert to cents)
        let priceInCents: number
        if (typeof price === "string") {
          // Remove currency symbols and parse
          const cleanPrice = price.replace(/[$,]/g, "")
          priceInCents = Math.round(Number.parseFloat(cleanPrice) * 100)
        } else {
          priceInCents = Math.round(Number(price) * 100)
        }

        if (Number.isNaN(priceInCents) || priceInCents < 0) {
          results.errors.push(`Row ${rowNum}: Invalid price value`)
          continue
        }

        // Convert and validate stock
        const stockNum = Number.parseInt(String(stock))
        if (Number.isNaN(stockNum) || stockNum < 0) {
          results.errors.push(`Row ${rowNum}: Invalid stock value`)
          continue
        }

        const product = new Product({
          sku: String(sku).trim(),
          name: String(name).trim(),
          price: priceInCents,
          stock: stockNum,
          barcode: barcode ? String(barcode).trim() : undefined,
          category: String(category).trim(),
          branchId: user.branchId || "default",
        })
        await product.save()

        results.success++
      } catch (error) {
        results.errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    return NextResponse.json({
      message: `Import completed. ${results.success} products imported successfully.`,
      results,
    })
  } catch (error) {
    console.error("Import products error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
