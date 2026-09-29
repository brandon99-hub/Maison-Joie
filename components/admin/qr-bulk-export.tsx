"use client"

import { Button } from "@/components/ui/button"
import { Download, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { SecretCode } from "@/lib/db"

interface QRBulkExportProps {
    selectedCodes: (SecretCode & { qrCodeData: string | null })[]
    onClearSelection: () => void
}

export function QRBulkExport({ selectedCodes, onClearSelection }: QRBulkExportProps) {
    const [loading, setLoading] = useState(false)

    const handleBulkExport = async () => {
        if (selectedCodes.length === 0) return

        setLoading(true)
        toast.info(`Exporting ${selectedCodes.length} QR codes...`)

        try {
            // Import JSZip dynamically
            const JSZip = (await import("jszip")).default
            const { jsPDF } = await import("jspdf")

            const zip = new JSZip()

            // Generate PDF for each selected code
            for (const code of selectedCodes) {
                if (!code.qrCodeData) continue

                const doc = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: [105, 148]
                })

                // Same template as individual export
                const width = 105
                const height = 148

                doc.setFillColor(255, 245, 250)
                doc.rect(0, 0, width, height, "F")

                doc.setDrawColor(236, 72, 153)
                doc.setLineWidth(0.5)
                doc.rect(5, 5, width - 10, height - 10, "S")

                doc.setDrawColor(251, 207, 232)
                doc.setLineWidth(0.3)
                doc.rect(7, 7, width - 14, height - 14, "S")

                doc.setFont("helvetica", "bold")
                doc.setFontSize(16)
                doc.setTextColor(236, 72, 153)
                doc.text("MAISON JOIE", width / 2, 20, { align: "center" })

                doc.setFont("helvetica", "normal")
                doc.setFontSize(9)
                doc.setTextColor(100, 100, 100)
                doc.text("Perfume with Elegance", width / 2, 26, { align: "center" })

                doc.setDrawColor(236, 72, 153)
                doc.setLineWidth(0.2)
                doc.line(25, 30, 80, 30)

                doc.setFont("helvetica", "bold")
                doc.setFontSize(14)
                doc.setTextColor(236, 72, 153)
                doc.text("🎁 SPECIAL GIFT", width / 2, 40, { align: "center" })

                const qrSize = 60
                const centerX = width / 2
                const centerY = height / 2

                doc.setFillColor(255, 255, 255)
                doc.roundedRect(centerX - (qrSize / 2) - 2, centerY - (qrSize / 2) - 2, qrSize + 4, qrSize + 4, 2, 2, "F")

                doc.addImage(code.qrCodeData, "PNG", centerX - (qrSize / 2), centerY - (qrSize / 2), qrSize, qrSize)

                doc.setFont("helvetica", "bold")
                doc.setFontSize(18)
                doc.setTextColor(236, 72, 153)
                doc.text(`${code.discount_percent}% OFF`, centerX, centerY + (qrSize / 2) + 12, { align: "center" })

                doc.setFont("helvetica", "normal")
                doc.setFontSize(9)
                doc.setTextColor(80, 80, 80)
                doc.text("Scan to unlock your", centerX, centerY + (qrSize / 2) + 20, { align: "center" })
                doc.text("secret product collection!", centerX, centerY + (qrSize / 2) + 25, { align: "center" })

                doc.setFont("courier", "bold")
                doc.setFontSize(8)
                doc.setTextColor(120, 120, 120)
                doc.text(`Code: ${code.code}`, centerX, height - 20, { align: "center" })

                if (code.expires_at) {
                    doc.setFont("helvetica", "normal")
                    doc.setFontSize(7)
                    doc.setTextColor(150, 150, 150)
                    const expiryDate = new Date(code.expires_at).toLocaleDateString("en-KE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                    })
                    doc.text(`Valid until: ${expiryDate}`, centerX, height - 15, { align: "center" })
                }

                doc.setFont("helvetica", "italic")
                doc.setFontSize(8)
                doc.setTextColor(236, 72, 153)
                doc.text("maison-joie.vercel.app", centerX, height - 10, { align: "center" })

                // Add PDF to ZIP
                const pdfBlob = doc.output("blob")
                zip.file(`SecretCode-${code.code}.pdf`, pdfBlob)
            }

            // Generate ZIP file
            const zipBlob = await zip.generateAsync({ type: "blob" })

            // Download ZIP
            const url = URL.createObjectURL(zipBlob)
            const a = document.createElement("a")
            a.href = url
            const date = new Date().toISOString().split("T")[0]
            a.download = `QR-Codes-${date}.zip`
            a.click()
            URL.revokeObjectURL(url)

            toast.success(`Exported ${selectedCodes.length} QR codes!`)
            onClearSelection()
        } catch (error) {
            console.error("Bulk export failed:", error)
            toast.error("Bulk export failed")
        } finally {
            setLoading(false)
        }
    }

    if (selectedCodes.length === 0) return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl shadow-lg p-4 flex items-center gap-4 z-50">
            <p className="text-sm font-medium">
                {selectedCodes.length} selected
            </p>
            <div className="flex gap-2">
                <Button
                    onClick={handleBulkExport}
                    disabled={loading}
                    size="sm"
                    className="gap-2"
                >
                    <Download className="w-4 h-4" />
                    Export as ZIP
                </Button>
                <Button
                    onClick={onClearSelection}
                    variant="outline"
                    size="sm"
                >
                    Clear
                </Button>
            </div>
        </div>
    )
}
