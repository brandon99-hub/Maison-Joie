"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireAdminAuth } from "@/lib/admin-auth"

function generateSecretCode(): string {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789"
    let code = ""
    for (let i = 0; i < 12; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}

export async function createSecretCode() {
    const auth = await requireAdminAuth()
    if (!auth.authorized) return { success: false, error: auth.error }

    try {
        const discountSetting = await sql`
      SELECT setting_value FROM app_settings
      WHERE setting_key = 'secret_discount_percent'
    `
        const discountPercent = discountSetting.length > 0
            ? parseInt(discountSetting[0].setting_value)
            : 10

        const code = generateSecretCode()
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 3)

        await sql`
      INSERT INTO secret_codes (code, discount_percent, expires_at)
      VALUES (${code}, ${discountPercent}, ${expiresAt.toISOString()})
    `

        revalidatePath("/admin/qr-codes")
        return { success: true, code }
    } catch (error) {
        console.error("Failed to create secret code:", error)
        return { success: false, error: "Failed to create secret code" }
    }
}

export async function markAsExported(id: number) {
    const auth = await requireAdminAuth()
    if (!auth.authorized) return { success: false, error: auth.error }

    try {
        await sql`
      UPDATE secret_codes 
      SET is_exported = TRUE 
      WHERE id = ${id}
    `
        revalidatePath("/admin/qr-codes")
        return { success: true }
    } catch (error) {
        console.error("Failed to mark QR as exported:", error)
        return { success: false, error: "Failed to update status" }
    }
}

export async function markAsScanned(code: string) {
    try {
        // Only mark as scanned if not already scanned (one-time only)
        const result = await sql`
      UPDATE secret_codes 
      SET is_scanned = TRUE, scanned_at = NOW()
      WHERE code = ${code} AND is_scanned = FALSE
      RETURNING id
    `

        if (result.length === 0) {
            return { success: false, error: "Code already scanned or invalid" }
        }

        // Note: revalidatePath removed - admin page will update on next visit
        return { success: true }
    } catch (error) {
        console.error("Failed to mark QR as scanned:", error)
        return { success: false, error: "Failed to update status" }
    }
}

export async function markAsUsed(code: string, orderId: number) {
    try {
        const result = await sql`
      UPDATE secret_codes
      SET is_used = TRUE, used_at = NOW(), order_id = ${orderId}
      WHERE code = ${code} AND is_used = FALSE
      RETURNING id
    `

        if (result.length === 0) {
            return { success: false, error: "Code already used or invalid" }
        }

        revalidatePath("/admin/qr-codes")
        return { success: true }
    } catch (error) {
        console.error("Failed to mark QR as used:", error)
        return { success: false, error: "Failed to update status" }
    }
}
