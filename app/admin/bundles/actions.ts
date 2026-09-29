"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireAdminAuth } from "@/lib/admin-auth"

export async function createBundle(data: {
  name: string
  description: string
  product_ids: number[]
  original_price: number
  bundle_price: number
  savings: number
  bundle_image?: string | null
}) {
  const auth = await requireAdminAuth()
  if (!auth.authorized) return { success: false, error: auth.error }

  try {
    const result = await sql`
      INSERT INTO bundles (name, description, product_ids, original_price, bundle_price, savings, bundle_image)
      VALUES (${data.name}, ${data.description}, ${data.product_ids}, ${data.original_price}, ${data.bundle_price}, ${data.savings}, ${data.bundle_image || null})
      RETURNING *
    `
    revalidatePath("/admin/bundles")
    revalidatePath("/bundles")
    revalidatePath("/")
    return { success: true, bundle: result[0] }
  } catch (error) {
    console.error("Error creating bundle:", error)
    return { success: false, error: "Failed to create bundle" }
  }
}

export async function updateBundle(id: number, data: {
  name: string
  description: string
  product_ids: number[]
  original_price: number
  bundle_price: number
  savings: number
  bundle_image?: string | null
}) {
  const auth = await requireAdminAuth()
  if (!auth.authorized) return { success: false, error: auth.error }

  try {
    const result = await sql`
      UPDATE bundles
      SET name = ${data.name},
          description = ${data.description},
          product_ids = ${data.product_ids},
          original_price = ${data.original_price},
          bundle_price = ${data.bundle_price},
          savings = ${data.savings},
          bundle_image = ${data.bundle_image || null}
      WHERE id = ${id}
      RETURNING *
    `
    revalidatePath("/admin/bundles")
    revalidatePath("/bundles")
    revalidatePath("/")
    return { success: true, bundle: result[0] }
  } catch (error) {
    console.error("Error updating bundle:", error)
    return { success: false, error: "Failed to update bundle" }
  }
}

export async function deleteBundle(id: number) {
  const auth = await requireAdminAuth()
  if (!auth.authorized) return { success: false, error: auth.error }

  try {
    await sql`DELETE FROM bundles WHERE id = ${id}`
    revalidatePath("/admin/bundles")
    revalidatePath("/bundles")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting bundle:", error)
    return { success: false, error: "Failed to delete bundle" }
  }
}

export async function toggleBundleStatus(id: number, isActive: boolean) {
  const auth = await requireAdminAuth()
  if (!auth.authorized) return { success: false, error: auth.error }

  try {
    await sql`UPDATE bundles SET is_active = ${isActive} WHERE id = ${id}`
    revalidatePath("/admin/bundles")
    revalidatePath("/bundles")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error toggling bundle status:", error)
    return { success: false, error: "Failed to update bundle" }
  }
}
