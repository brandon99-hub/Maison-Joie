"use server"

import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { passwordSchema } from "@/lib/validation"

export async function resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
        return { success: false, error: "Invalid request" }
    }

    const passwordCheck = passwordSchema.safeParse(newPassword)
    if (!passwordCheck.success) {
        return { success: false, error: passwordCheck.error.issues[0].message }
    }

    try {
        // Find and validate token
        const tokens = await sql`
      SELECT user_id, expires_at, used 
      FROM password_reset_tokens 
      WHERE token = ${token}
    `

        if (!tokens.length) {
            return { success: false, error: "Invalid or expired reset link" }
        }

        const tokenData = tokens[0]

        // Check if token was already used
        if (tokenData.used) {
            return { success: false, error: "This reset link has already been used" }
        }

        // Check if token expired
        if (new Date() > new Date(tokenData.expires_at)) {
            return { success: false, error: "This reset link has expired. Please request a new one." }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update user password
        await sql`
      UPDATE admin_users 
      SET password_hash = ${hashedPassword}
      WHERE id = ${tokenData.user_id}
    `

        // Mark token as used
        await sql`
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE token = ${token}
    `

        return { success: true }
    } catch (error) {
        console.error("Password reset error:", error)
        return { success: false, error: "An error occurred. Please try again." }
    }
}

export async function validateResetToken(token: string) {
    try {
        const tokens = await sql`
      SELECT expires_at, used 
      FROM password_reset_tokens 
      WHERE token = ${token}
    `

        if (!tokens.length) {
            return { valid: false, error: "Invalid reset link" }
        }

        const tokenData = tokens[0]

        if (tokenData.used) {
            return { valid: false, error: "This reset link has already been used" }
        }

        if (new Date() > new Date(tokenData.expires_at)) {
            return { valid: false, error: "This reset link has expired" }
        }

        return { valid: true }
    } catch (error) {
        console.error("Token validation error:", error)
        return { valid: false, error: "An error occurred" }
    }
}
