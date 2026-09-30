"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, CheckSquare, Square, Plus, Loader2 } from "lucide-react"
import type { SecretCode } from "@/lib/db"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QRStatistics } from "@/components/admin/qr-statistics"
import { QRCodePDFExporter } from "@/components/admin/qr-pdf-export"
import { QRBulkExport } from "@/components/admin/qr-bulk-export"
import { Checkbox } from "@/components/ui/checkbox"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { createSecretCode } from "@/app/admin/qr-codes/actions"
import { toast } from "sonner"

interface QRCodesClientProps {
    codesWithQr: (SecretCode & {
        order_reference?: string
        secretUrl: string
        qrCodeData: string | null
    })[]
}

export function QRCodesClient({ codesWithQr }: QRCodesClientProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [exportFilter, setExportFilter] = useState<string>("all")
    const [selectedCodes, setSelectedCodes] = useState<Set<number>>(new Set())
    const [generating, setGenerating] = useState(false)

    const handleGenerate = async () => {
        setGenerating(true)
        const result = await createSecretCode()
        if (result.success) {
            toast.success(`New code generated: ${result.code}`)
            router.refresh()
        } else {
            toast.error(result.error || "Failed to generate code")
        }
        setGenerating(false)
    }

    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date()
        const active = codesWithQr.filter(c => !c.is_used && (!c.expires_at || new Date(c.expires_at) >= now)).length
        const used = codesWithQr.filter(c => c.is_used).length
        const expired = codesWithQr.filter(c => !c.is_used && c.expires_at && new Date(c.expires_at) < now).length
        const exported = codesWithQr.filter(c => c.is_exported).length

        return {
            total: codesWithQr.length,
            active,
            used,
            expired,
            exported
        }
    }, [codesWithQr])

    // Filter codes
    const filteredCodes = useMemo(() => {
        return codesWithQr.filter(code => {
            // Search filter
            const matchesSearch = !searchTerm ||
                code.order_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                code.code.toLowerCase().includes(searchTerm.toLowerCase())

            // Status filter
            const now = new Date()
            const isExpired = code.expires_at && new Date(code.expires_at) < now
            const isActive = !code.is_used && !isExpired

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && isActive) ||
                (statusFilter === "used" && code.is_used) ||
                (statusFilter === "expired" && isExpired)

            // Export filter
            const matchesExport =
                exportFilter === "all" ||
                (exportFilter === "exported" && code.is_exported) ||
                (exportFilter === "pending" && !code.is_exported)

            return matchesSearch && matchesStatus && matchesExport
        })
    }, [codesWithQr, searchTerm, statusFilter, exportFilter])

    const toggleSelection = (id: number) => {
        const newSelected = new Set(selectedCodes)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedCodes(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedCodes.size === filteredCodes.length) {
            setSelectedCodes(new Set())
        } else {
            setSelectedCodes(new Set(filteredCodes.map(c => c.id)))
        }
    }

    const selectedCodesData = codesWithQr.filter(c => selectedCodes.has(c.id))

    return (
        <div className="p-6 md:p-8">
            <AdminPageHeader
                title="Secret QR Codes"
                description="Manually generate one-time codes for loyal customers, then track and export them."
                actions={
                    <Button onClick={handleGenerate} disabled={generating} className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]">
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Generate New Code
                            </>
                        )}
                    </Button>
                }
            />

            {/* Statistics */}
            <QRStatistics {...stats} />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by order reference or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={exportFilter} onValueChange={setExportFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Export Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="exported">Exported</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                </Select>

                {filteredCodes.length > 0 && (
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                    >
                        {selectedCodes.size === filteredCodes.length ? (
                            <CheckSquare className="w-4 h-4" />
                        ) : (
                            <Square className="w-4 h-4" />
                        )}
                        <span className="text-sm">Select All</span>
                    </button>
                )}
            </div>

            {/* QR Codes List */}
            <div className="space-y-4">
                {filteredCodes.map((sc) => {
                    const isExpired = sc.expires_at && new Date(sc.expires_at) < new Date()
                    const isSelected = selectedCodes.has(sc.id)

                    return (
                        <div
                            key={sc.id}
                            className={`bg-card border rounded-xl p-6 transition-all ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
                                }`}
                        >
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Selection Checkbox */}
                                <div className="flex items-start">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSelection(sc.id)}
                                    />
                                </div>

                                {/* QR Code Preview - Large */}
                                <div className="flex-shrink-0">
                                    {sc.qrCodeData && (
                                        <div className="p-3 bg-white border rounded-lg w-fit">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={sc.qrCodeData} alt="QR" className="w-32 h-32" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {sc.order_reference ? `Order #${sc.order_reference}` : "Not yet redeemed"}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Code: <span className="font-mono font-medium text-foreground">{sc.code}</span>
                                            </p>
                                        </div>
                                        <span
                                            className={`text-xs px-3 py-1 rounded-full font-medium ${sc.is_used
                                                    ? "bg-gray-100 text-gray-600"
                                                    : isExpired
                                                        ? "bg-amber-50 text-amber-600"
                                                        : "bg-green-50 text-green-600"
                                                }`}
                                        >
                                            {sc.is_used ? "Used" : isExpired ? "Expired" : "Active"}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Discount</p>
                                            <p className="font-semibold text-primary">{sc.discount_percent}% OFF</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Created</p>
                                            <p className="font-medium">
                                                {new Date(sc.created_at).toLocaleDateString("en-KE", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric"
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Expires</p>
                                            <p className="font-medium">
                                                {sc.expires_at
                                                    ? new Date(sc.expires_at).toLocaleDateString("en-KE", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric"
                                                    })
                                                    : "Never"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <QRCodePDFExporter code={sc} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {filteredCodes.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        {searchTerm || statusFilter !== "all" || exportFilter !== "all"
                            ? "No QR codes match your filters"
                            : "No QR codes yet"}
                    </div>
                )}
            </div>

            {/* Bulk Export Floating Bar */}
            <QRBulkExport
                selectedCodes={selectedCodesData}
                onClearSelection={() => setSelectedCodes(new Set())}
            />
        </div>
    )
}
