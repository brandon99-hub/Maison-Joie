"use server"

import { sql, type CartItem } from "@/lib/db"
import { orderSchema, type OrderInput } from "@/lib/validation"

function generateReferenceCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = "CG"
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createOrder(data: OrderInput, customerId?: number) {
  try {
    // Validate input data
    const validated = orderSchema.parse(data)
    const referenceCode = generateReferenceCode()

    // Check stock availability for all items before creating order.
    // Also track whether this order genuinely contains a secret product —
    // used below to decide whether a secret code should actually be redeemed.
    let hasSecretItem = false
    for (const item of validated.items) {
      const product = await sql`
        SELECT stock_quantity, name, is_secret
        FROM products
        WHERE id = ${item.product_id}
      `

      if (product.length === 0) {
        return { success: false, error: `Product not found` }
      }

      const currentStock = product[0].stock_quantity
      if (currentStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${product[0].name}. Only ${currentStock} available.`
        }
      }

      if (product[0].is_secret) hasSecretItem = true
    }

    // Create the order
    const orderResult = await sql`
      INSERT INTO orders (
        reference_code, 
        customer_id,
        customer_name, 
        phone_number, 
        pickup_location, 
        items, 
        total_amount,
        delivery_method,
        delivery_fee,
        pickup_mtaani_location,
        address_type,
        estate_name,
        house_number,
        landmark,
        latitude,
        longitude,
        status
      ) VALUES (
        ${referenceCode},
        ${customerId || null},
        ${validated.customerName},
        ${validated.phoneNumber},
        ${validated.pickupLocation},
        ${JSON.stringify(validated.items)},
        ${validated.totalAmount},
        ${validated.deliveryMethod || "self-pickup"},
        ${validated.deliveryFee || 0},
        ${validated.pickupMtaaniLocationId ? validated.pickupLocation : null},
        ${validated.address_type || null},
        ${validated.estate_name || null},
        ${validated.house_number || null},
        ${validated.landmark || null},
        ${validated.latitude || null},
        ${validated.longitude || null},
        'pending'
      )
      RETURNING id
    `

    const orderId = orderResult[0]?.id

    // Deduct inventory for each product
    for (const item of validated.items) {
      await sql`
        UPDATE products 
        SET stock_quantity = stock_quantity - ${item.quantity}
        WHERE id = ${item.product_id}
      `
    }

    // Mark secret code as used if provided. Only a genuinely valid, unused code
    // (verified server-side by markAsUsed) AND an order that actually contains
    // a secret product gets stamped onto the order — a stale code leftover
    // from an earlier /secret/[code] visit never hijacks an unrelated,
    // all-regular order, and never blocks checkout either way.
    if (validated.secretCode && hasSecretItem && orderId) {
      const { markAsUsed } = await import("@/app/admin/qr-codes/actions")
      const redemption = await markAsUsed(validated.secretCode, orderId)
      if (redemption.success) {
        await sql`
          UPDATE orders SET secret_code = ${validated.secretCode} WHERE id = ${orderId}
        `
      }
    }

    return { success: true, referenceCode }
  } catch (error) {
    console.error("Error creating order:", error)

    // Return validation errors if it's a Zod error
    if (error instanceof Error && error.name === "ZodError") {
      return { success: false, error: "Invalid order data. Please check your inputs." }
    }

    return { success: false, error: "Failed to create order" }
  }
}
