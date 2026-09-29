"use server"

import { sql, type Order } from "@/lib/db"
import { requireAdminAuth } from "@/lib/admin-auth"

function generateSecretCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"
  let code = ""
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function updateOrderStatus(orderId: number, newStatus: Order["status"]) {
  const auth = await requireAdminAuth()
  if (!auth.authorized) return { success: false, error: auth.error }

  try {
    // If confirming payment, create secret discount QR code
    if (newStatus === "paid") {
      // Get discount setting from database
      const discountSetting = await sql`
        SELECT setting_value FROM app_settings
        WHERE setting_key = 'secret_discount_percent'
      `
      const discountPercent = discountSetting.length > 0
        ? parseInt(discountSetting[0].setting_value)
        : 10

      // Create secret QR code with dynamic discount
      const secretCode = generateSecretCode()
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 3) // Expires in 3 months

      await sql`
        INSERT INTO secret_codes (code, order_id, discount_percent, expires_at)
        VALUES (${secretCode}, ${orderId}, ${discountPercent}, ${expiresAt.toISOString()})
      `

      // Mark order as paid
      await sql`
        UPDATE orders
        SET status = ${newStatus},
            mpesa_confirmed = true,
            updated_at = NOW()
        WHERE id = ${orderId}
      `
    } else {
      await sql`
        UPDATE orders 
        SET status = ${newStatus}, updated_at = NOW()
        WHERE id = ${orderId}
      `
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating order:", error)
    return { success: false, error: "Failed to update order" }
  }
}
