import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

// GET - Export expenses
export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const format = searchParams.get("format") || "csv" // csv, excel, pdf
        const month = searchParams.get("month") // Optional filter

        // Build query
        const where: any = { userId: session.userId }
        if (month) {
            const [year, monthNum] = month.split("-")
            const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
            const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59)
            where.purchaseDate = { gte: startDate, lte: endDate }
        }

        const expenses = await prisma.medicineExpense.findMany({
            where,
            orderBy: { purchaseDate: "desc" }
        })

        if (expenses.length === 0) {
            return NextResponse.json({ error: "No expenses to export" }, { status: 400 })
        }

        switch (format) {
            case "csv":
                return generateCSV(expenses)
            case "excel":
                return generateExcel(expenses)
            case "pdf":
                return generatePDF(expenses)
            default:
                return NextResponse.json({ error: "Invalid format" }, { status: 400 })
        }
    } catch (error) {
        console.error("Export error:", error)
        return NextResponse.json({ error: "Export failed" }, { status: 500 })
    }
}

function generateCSV(expenses: any[]) {
    const headers = ["Date", "Medicine", "Quantity", "Price", "Category", "Pharmacy", "Source", "Notes"]
    const rows = expenses.map(e => [
        new Date(e.purchaseDate).toLocaleDateString(),
        e.medicineName,
        e.quantity || "",
        e.price.toFixed(2),
        e.category || "",
        e.pharmacyName || "",
        e.importSource,
        e.notes || ""
    ])

    const csv = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="medicine-expenses-${Date.now()}.csv"`
        }
    })
}

function generateExcel(expenses: any[]) {
    const data = expenses.map(e => ({
        Date: new Date(e.purchaseDate).toLocaleDateString(),
        Medicine: e.medicineName,
        Quantity: e.quantity || "",
        Price: e.price,
        Category: e.category || "",
        Pharmacy: e.pharmacyName || "",
        Source: e.importSource,
        Notes: e.notes || ""
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses")

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="medicine-expenses-${Date.now()}.xlsx"`
        }
    })
}

function generatePDF(expenses: any[]) {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.text("Medicine Expense Report", 14, 20)

    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28)
    doc.text(`Total Expenses: ${expenses.length}`, 14, 34)
    doc.text(`Total Amount: ₹${expenses.reduce((sum, e) => sum + e.price, 0).toFixed(2)}`, 14, 40)

    // Table
    autoTable(doc, {
        startY: 48,
        head: [["Date", "Medicine", "Qty", "Price", "Pharmacy"]],
        body: expenses.map(e => [
            new Date(e.purchaseDate).toLocaleDateString(),
            e.medicineName,
            e.quantity || "-",
            `₹${e.price.toFixed(2)}`,
            e.pharmacyName || "-"
        ]),
        theme: "grid",
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 }
    })

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="medicine-expenses-${Date.now()}.pdf"`
        }
    })
}
