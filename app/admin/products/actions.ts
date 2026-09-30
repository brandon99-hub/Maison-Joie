"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminAuth } from "@/lib/admin-auth"

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    price: z.coerce.number().min(0, "Price must be positive"),
    stock_quantity: z.coerce.number().int().min(0, "Stock must be positive"),
    category: z.string().min(1, "Category is required"),
    images: z.string().transform((val) => val.split(",").filter((url) => url.trim() !== "")),
    is_active: z.coerce.boolean().default(true),
    is_secret: z.coerce.boolean().default(false),
    secret_discount_percent: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : val),
        z.coerce.number().int().min(0).max(100).optional()
    ),
})

export async function createProduct(formData: FormData) {
    const auth = await requireAdminAuth()
    if (!auth.authorized) return { success: false, error: auth.error }

    try {
        const rawData = {
            name: formData.get("name"),
            description: formData.get("description"),
            price: formData.get("price"),
            stock_quantity: formData.get("stock_quantity"),
            category: formData.get("category"),
            images: formData.get("images"),
            is_active: formData.get("is_active") === "on",
            is_secret: formData.get("is_secret") === "on",
            secret_discount_percent: formData.get("secret_discount_percent"),
        }

        const validatedData = productSchema.parse(rawData)

        // Helper to format array for postgres text[]
        const imagesArray = `{${validatedData.images.map(img => `"${img}"`).join(",")}}`

        // Create slug from name
        const slug = validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString().slice(-4)

        await sql`
      INSERT INTO products (
        name, slug, description, price, stock_quantity,
        category, images, is_active, is_secret, secret_discount_percent, created_at
      )
      VALUES (
        ${validatedData.name},
        ${slug},
        ${validatedData.description},
        ${validatedData.price},
        ${validatedData.stock_quantity},
        ${validatedData.category},
        ${imagesArray},
        ${validatedData.is_active},
        ${validatedData.is_secret},
        ${validatedData.secret_discount_percent ?? null},
        NOW()
      )
    `

        revalidatePath("/admin/products")
        return { success: true }
    } catch (error) {
        console.error("Failed to create product:", error)
        return { success: false, error: "Failed to create product" }
    }
}

export async function updateProduct(formData: FormData) {
    const auth = await requireAdminAuth()
    if (!auth.authorized) return { success: false, error: auth.error }

    try {
        const id = formData.get("id")
        const rawData = {
            name: formData.get("name"),
            description: formData.get("description"),
            price: formData.get("price"),
            stock_quantity: formData.get("stock_quantity"),
            category: formData.get("category"),
            images: formData.get("images"),
            is_active: formData.get("is_active") === "on",
            is_secret: formData.get("is_secret") === "on",
            secret_discount_percent: formData.get("secret_discount_percent"),
        }

        const validatedData = productSchema.parse(rawData)
        const imagesArray = `{${validatedData.images.map(img => `"${img}"`).join(",")}}`

        // Get current stock before update
        const currentProduct = await sql`
      SELECT stock_quantity FROM products WHERE id = ${Number(id)}
    `
        const previousStock = currentProduct[0]?.stock_quantity || 0

        await sql`
        UPDATE products 
        SET 
          name = ${validatedData.name}, 
          description = ${validatedData.description}, 
          price = ${validatedData.price}, 
          stock_quantity = ${validatedData.stock_quantity}, 
          category = ${validatedData.category},
          images = ${imagesArray},
          is_active = ${validatedData.is_active},
          is_secret = ${validatedData.is_secret},
          secret_discount_percent = ${validatedData.secret_discount_percent ?? null}
        WHERE id = ${Number(id)}
      `

        // Automatic waitlist notification: if stock went from 0 to >0, notify waitlist
        if (previousStock === 0 && validatedData.stock_quantity > 0) {
            // Import and call notifyWaitlist
            const { notifyWaitlist } = await import("@/app/api/waitlist/actions")
            await notifyWaitlist(Number(id))
            console.log(`Auto-notified waitlist for product ${id} - stock restored`)
        }

        revalidatePath("/admin/products")
        revalidatePath("/admin/waitlist")
        return { success: true }
    } catch (error) {
        console.error("Failed to update product:", error)
        return { success: false, error: "Failed to update product" }
    }
}

export async function deleteProduct(id: number) {
    const auth = await requireAdminAuth()
    if (!auth.authorized) return { success: false, error: auth.error }

    try {
        await sql`DELETE FROM products WHERE id = ${id}`
        revalidatePath("/admin/products")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete product:", error)
        return { success: false, error: "Failed to delete product" }
    }
}

export async function toggleProductStatus(id: number, isActive: boolean) {
    const auth = await requireAdminAuth()
    if (!auth.authorized) return { success: false, error: auth.error }

    try {
        await sql`UPDATE products SET is_active = ${isActive} WHERE id = ${id}`
        revalidatePath("/admin/products")
        return { success: true }
    } catch (error) {
        console.error("Failed to toggle product status:", error)
        return { success: false, error: "Failed to toggle status" }
    }
}
