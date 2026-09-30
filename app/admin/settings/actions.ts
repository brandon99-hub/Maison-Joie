"use server"

import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { requireAdminAuth } from "@/lib/admin-auth"
import { passwordSchema } from "@/lib/validation"

export async function updateAdminEmail(email: string) {
    const auth = await requireAdminAuth()
    if (!auth.authorized) return { success: false, error: auth.error }

    if (!email || !email.includes("@")) {
        return { success: false, error: "Invalid email address" }
    }

    try {
        await sql`
      UPDATE admin_users 
      SET email = ${email}
      WHERE username = 'admin'
    `

        return { success: true }
    } catch (error) {
        console.error("Error updating email:", error)
        return { success: false, error: "Failed to update email" }
    }
}

export async function updateAdminPassword(currentPassword: string, newPassword: string) {
    const auth = await requireAdminAuth()
    if (!auth.authorized) return { success: false, error: auth.error }

    const passwordCheck = passwordSchema.safeParse(newPassword)
    if (!passwordCheck.success) {
        return { success: false, error: passwordCheck.error.issues[0].message }
    }

    try {
        // Verify current password
        const users = await sql`
      SELECT password_hash FROM admin_users WHERE username = 'admin'
    `

        if (!users.length) {
            return { success: false, error: "User not found" }
        }

        const isValid = await bcrypt.compare(currentPassword, users[0].password_hash)

        if (!isValid) {
            return { success: false, error: "Current password is incorrect" }
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await sql`
      UPDATE admin_users 
      SET password_hash = ${hashedPassword}
      WHERE username = 'admin'
    `

        return { success: true }
    } catch (error) {
        console.error("Error updating password:", error)
        return { success: false, error: "Failed to update password" }
    }
}

export async function getAdminSettings() {
    const auth = await requireAdminAuth()
    if (!auth.authorized) return { success: false, error: auth.error }

    try {
        const users = await sql`
      SELECT username, email FROM admin_users WHERE username = 'admin'
    `

        if (!users.length) {
            return { success: false, error: "User not found" }
        }

        return { success: true, data: users[0] }
    } catch (error) {
        console.error("Error fetching settings:", error)
        return { success: false, error: "Failed to fetch settings" }
    }
}

export async function getDiscountSetting() {
    const auth = await requireAdminAuth()
    if (!auth.authorized) return { success: false, error: auth.error }

    try {
        const settings = await sql`
      SELECT setting_value FROM app_settings 
      WHERE setting_key = 'secret_discount_percent'
    `

        const discountPercent = settings.length > 0 ? parseInt(settings[0].setting_value) : 10

        return { success: true, discountPercent }
    } catch (error) {
        console.error("Error fetching discount setting:", error)
        return { success: false, error: "Failed to fetch discount setting", discountPercent: 10 }
    }
}

export async function updateDiscountSetting(discountPercent: number) {
    const auth = await requireAdminAuth()
    if (!auth.authorized) return { success: false, error: auth.error }

    if (discountPercent < 1 || discountPercent > 100) {
        return { success: false, error: "Discount must be between 1% and 100%" }
    }

    try {
        await sql`
      INSERT INTO app_settings (setting_key, setting_value, updated_at)
      VALUES ('secret_discount_percent', ${discountPercent.toString()}, NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET setting_value = ${discountPercent.toString()}, updated_at = NOW()
    `

        return { success: true }
    } catch (error) {
        console.error("Error updating discount setting:", error)
        return { success: false, error: "Failed to update discount setting" }
    }
}
