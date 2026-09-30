"use server"

import { sql, type Order } from "@/lib/db"
import { requireAdminAuth } from "@/lib/admin-auth"

export async function updateOrderStatus(orderId: number, newStatus: Order["status"]) {
  const auth = await requireAdminAuth()
  if (!auth.authorized) return { success: false, error: auth.error }

  try {
    if (newStatus === "paid") {
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
