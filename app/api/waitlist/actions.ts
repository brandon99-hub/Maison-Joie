"use server"

import { sql } from "@/lib/db"
import { auth } from "@/lib/auth-helper"
import { revalidatePath } from "next/cache"
import { sendBackInStockEmail } from "@/lib/email"

export async function joinWaitlist(productId: number, email?: string) {
    try {
        const session = await auth()

        // If logged in, use customer ID
        if (session?.user?.id) {
            const customerId = parseInt(session.user.id)

            // Get customer email
            const customers = await sql`
        SELECT email FROM customers WHERE id = ${customerId}
      `
            const customerEmail = customers[0]?.email

            // Check if already on waitlist
            const existing = await sql`
        SELECT id FROM product_waitlists
        WHERE product_id = ${productId} AND customer_id = ${customerId}
      `

            if (existing.length > 0) {
                return { success: false, error: "You're already on the waitlist!" }
            }

            // Add to waitlist
            await sql`
        INSERT INTO product_waitlists (product_id, customer_id, email)
        VALUES (${productId}, ${customerId}, ${customerEmail})
      `

            return { success: true, message: "You're on the waitlist! We'll email you when it's back." }
        } else {
            // Guest user - require email
            if (!email) {
                return { success: false, error: "Please provide your email" }
            }

            // Check if email already on waitlist
            const existing = await sql`
        SELECT id FROM product_waitlists
        WHERE product_id = ${productId} AND email = ${email}
      `

            if (existing.length > 0) {
                return { success: false, error: "This email is already on the waitlist!" }
            }

            // Add to waitlist
            await sql`
        INSERT INTO product_waitlists (product_id, email)
        VALUES (${productId}, ${email})
      `

            return { success: true, message: "You're on the waitlist! We'll email you when it's back." }
        }
    } catch (error) {
        console.error("Waitlist error:", error)
        return { success: false, error: "Failed to join waitlist" }
    }
}

export async function notifyWaitlist(productId: number) {
    try {
        // Get product details
        const products = await sql`
      SELECT * FROM products WHERE id = ${productId}
    `

        if (products.length === 0) {
            return { success: false, error: "Product not found" }
        }

        const product = products[0] as any

        // Get all waitlist entries for this product
        const waitlist = await sql`
      SELECT * FROM product_waitlists
      WHERE product_id = ${productId} AND notified = false
    `

        if (waitlist.length === 0) {
            return { success: true, emails: [], count: 0, message: "No customers on waitlist" }
        }

        // Send emails to all customers
        const emailResults = []
        for (const entry of waitlist) {
            const result = await sendBackInStockEmail(
                entry.email,
                product.name,
                product.slug,
                product.images?.[0]
            )
            emailResults.push({ email: entry.email, success: result.success })
        }

        // Mark as notified
        await sql`
      UPDATE product_waitlists
      SET notified = true
      WHERE product_id = ${productId}
    `

        const successCount = emailResults.filter(r => r.success).length
        const failedCount = emailResults.length - successCount

        return {
            success: true,
            emails: waitlist.map((w: any) => w.email),
            count: waitlist.length,
            successCount,
            failedCount,
            message: `Notified ${successCount} customers${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
        }
    } catch (error) {
        console.error("Notify waitlist error:", error)
        return { success: false, error: "Failed to notify waitlist" }
    }
}

export async function getProductRecommendations(limit = 6) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            // Guest user - show trending and new products
            const products = await sql`
        SELECT * FROM products
        WHERE is_active = true 
        AND is_secret = false
        AND stock_quantity > 0
        ORDER BY 
          wishlist_count DESC,
          average_rating DESC NULLS LAST,
          created_at DESC
        LIMIT ${limit}
      `
            return { success: true, products }
        }

        const customerId = parseInt(session.user.id)

        // Get customer's purchase history
        const orders = await sql`
      SELECT items FROM orders
      WHERE customer_id = ${customerId}
      AND status IN ('paid', 'packed', 'collected')
    `

        if (orders.length === 0) {
            // No purchase history - show trending products with mix of categories
            const products = await sql`
        SELECT * FROM products
        WHERE is_active = true 
        AND is_secret = false
        AND stock_quantity > 0
        ORDER BY 
          wishlist_count DESC,
          average_rating DESC NULLS LAST,
          created_at DESC
        LIMIT ${limit}
      `
            return { success: true, products }
        }

        // Extract purchased product IDs and categories
        const purchasedProductIds: number[] = []
        const purchasedCategories = new Set<string>()

        for (const order of orders) {
            const items = order.items as any[]
            for (const item of items) {
                purchasedProductIds.push(item.product_id)
            }
        }

        // Get categories of purchased products
        if (purchasedProductIds.length > 0) {
            const purchasedProducts = await sql`
        SELECT DISTINCT category FROM products
        WHERE id = ANY(${purchasedProductIds})
      `
            purchasedProducts.forEach((p: any) => purchasedCategories.add(p.category))
        }

        const categoriesArray = Array.from(purchasedCategories)

        // Smart recommendations: prioritize same category, then popular
        const recommendations = await sql`
      SELECT * FROM products
      WHERE is_active = true
      AND is_secret = false
      AND stock_quantity > 0
      AND id != ALL(${purchasedProductIds})
      ORDER BY
        -- Priority 1: Same category as purchased items
        CASE WHEN category = ANY(${categoriesArray.length > 0 ? categoriesArray : ['']}) THEN 0 ELSE 1 END,
        -- Priority 2: Popular items
        wishlist_count DESC,
        -- Priority 3: Highly rated
        average_rating DESC NULLS LAST,
        -- Priority 4: New arrivals
        created_at DESC
      LIMIT ${limit}
    `

        return { success: true, products: recommendations }
    } catch (error) {
        console.error("Recommendations error:", error)
        return { success: false, error: "Failed to get recommendations" }
    }
}
