"use client"

import { Button } from "@/components/ui/button"
import { Download, Check, Eye } from "lucide-react"
import { jsPDF } from "jspdf"
import type { SecretCode } from "@/lib/db"
import { markAsExported } from "@/app/admin/qr-codes/actions"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface QRCodePDFExporterProps {
    code: SecretCode & {
        order_reference?: string
        secretUrl: string
        qrCodeData: string | null
    }
    onPreview?: () => void
}

export function QRCodePDFExporter({ code, onPreview }: QRCodePDFExporterProps) {
    const [loading, setLoading] = useState(false)

    const generateGiftCardPDF = () => {
        if (!code.qrCodeData) return null

        // Gift Card Style (105mm x 148mm - A6)
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [105, 148]
        })

        const width = 105
        const height = 148

        // Gradient Background (Rose to Amber)
        doc.setFillColor(255, 245, 250) // Light pink
        doc.rect(0, 0, width, height, "F")

        // Decorative Border
        doc.setDrawColor(236, 72, 153) // Pink-500
        doc.setLineWidth(0.5)
        doc.rect(5, 5, width - 10, height - 10, "S")

        // Inner decorative border
        doc.setDrawColor(251, 207, 232) // Pink-200
        doc.setLineWidth(0.3)
        doc.rect(7, 7, width - 14, height - 14, "S")

        // -- Top Section: Brand --
        doc.setFont("helvetica", "bold")
        doc.setFontSize(16)
        doc.setTextColor(236, 72, 153) // Pink-500
        doc.text("MAISON JOIE", width / 2, 20, { align: "center" })

        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text("Hair Clips & Lip Gloss", width / 2, 26, { align: "center" })

        // Decorative line
        doc.setDrawColor(236, 72, 153)
        doc.setLineWidth(0.2)
        doc.line(25, 30, 80, 30)

        // -- Gift Card Title --
        doc.setFont("helvetica", "bold")
        doc.setFontSize(14)
        doc.setTextColor(236, 72, 153)
        doc.text("🎁 SPECIAL GIFT", width / 2, 40, { align: "center" })

        // -- QR Code (Center) --
        const qrSize = 60
        const centerX = width / 2
        const centerY = height / 2

        // QR background (white)
        doc.setFillColor(255, 255, 255)
        doc.roundedRect(centerX - (qrSize / 2) - 2, centerY - (qrSize / 2) - 2, qrSize + 4, qrSize + 4, 2, 2, "F")

        doc.addImage(code.qrCodeData, "PNG", centerX - (qrSize / 2), centerY - (qrSize / 2), qrSize, qrSize)

        // -- Discount Badge --
        doc.setFont("helvetica", "bold")
        doc.setFontSize(18)
        doc.setTextColor(236, 72, 153)
        doc.text(`${code.discount_percent}% OFF`, centerX, centerY + (qrSize / 2) + 12, { align: "center" })

        // -- Instructions --
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)
        doc.text("Scan to unlock your", centerX, centerY + (qrSize / 2) + 20, { align: "center" })
        doc.text("secret product collection!", centerX, centerY + (qrSize / 2) + 25, { align: "center" })

        // -- Bottom Section --
        // Secret Code
        doc.setFont("courier", "bold")
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        doc.text(`Code: ${code.code}`, centerX, height - 20, { align: "center" })

        // Expiry Date
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

        // Website
        doc.setFont("helvetica", "italic")
        doc.setFontSize(8)
        doc.setTextColor(236, 72, 153)
        doc.text("maison-joie.vercel.app", centerX, height - 10, { align: "center" })

        return doc
    }

    const handleExport = async () => {
        if (!code.qrCodeData) return
        setLoading(true)

        try {
            const doc = generateGiftCardPDF()
            if (!doc) {
                toast.error("Failed to generate PDF")
                return
            }

            doc.save(`GiftCard-${code.code}.pdf`)

            // Mark as exported in DB
            await markAsExported(code.id)
            toast.success("PDF exported successfully!")
        } catch (e) {
            console.error("Export failed", e)
            toast.error("Export failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex gap-2">
            {onPreview && (
                <Button
                    onClick={onPreview}
                    variant="outline"
                    size="sm"
                    disabled={!code.qrCodeData}
                    className="gap-2"
                >
                    <Eye className="w-3 h-3" /> Preview
                </Button>
            )}
            <Button
                onClick={handleExport}
                variant={code.is_exported ? "outline" : "default"}
                size="sm"
                disabled={loading || !code.qrCodeData}
                className={cn("gap-2", code.is_exported && "text-green-600 border-green-200 hover:border-green-300 bg-green-50 hover:bg-green-100")}
            >
                {code.is_exported ? (
                    <>
                        <Check className="w-3 h-3" /> Exported
                    </>
                ) : (
                    <>
                        <Download className="w-3 h-3" /> Export PDF
                    </>
                )}
            </Button>
        </div>
    )
}
