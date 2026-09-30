"use server"

import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import type { Customer } from "@/lib/db"
import { migrateWishlistToAccount } from "@/lib/wishlist-migration"
import { sendCustomerPasswordResetEmail } from "@/lib/email"
import { passwordSchema } from "@/lib/validation"

export async function loginAction(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
        return { success: false, error: "Email and password are required" }
    }

    try {
        // Verify credentials
        const customers = await sql`
      SELECT * FROM customers WHERE email = ${email}
    ` as Customer[]

        if (customers.length === 0) {
            return { success: false, error: "Invalid email or password" }
        }

        const customer = customers[0]
        const passwordMatch = await bcrypt.compare(password, customer.password_hash)

        if (!passwordMatch) {
            return { success: false, error: "Invalid email or password" }
        }

        // Migrate wishlist
        await migrateWishlistToAccount(customer.id)

        // Return success — NO plaintext password. Client uses its own form values to call signIn.
        return { success: true }
    } catch (error) {
        console.error("Login error:", error)
        return { success: false, error: "Login failed" }
    }
}

export async function registerAction(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string

    // Server-side input validation
    if (!email || !password || !name) {
        return { success: false, error: "All fields are required" }
    }

    const passwordCheck = passwordSchema.safeParse(password)
    if (!passwordCheck.success) {
        return { success: false, error: passwordCheck.error.issues[0].message }
    }

    // Validate Kenyan phone number format
    if (phone && !/^(07|01)\d{8}$/.test(phone)) {
        return { success: false, error: "Invalid phone number format (e.g. 0712345678)" }
    }

    try {
        // Check if user already exists
        const existing = await sql`
      SELECT id FROM customers WHERE email = ${email}
    ` as Customer[]

        if (existing.length > 0) {
            return { success: false, error: "Email already registered" }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)

        // Create customer
        const customers = await sql`
      INSERT INTO customers (email, password_hash, name, phone_number)
      VALUES (${email}, ${passwordHash}, ${name}, ${phone || null})
      RETURNING id
    ` as Customer[]

        const customerId = customers[0].id

        // Migrate session wishlist to new account
        await migrateWishlistToAccount(customerId)

        // Return success — NO plaintext password. Client uses its own form values to call signIn.
        return { success: true }
    } catch (error) {
        console.error("Registration error:", error)
        return { success: false, error: "Failed to create account" }
    }
}

export async function createAccountFromOrder(data: {
    email: string
    password: string
    referenceCode: string
    name?: string
}) {
    if (!data.email || !data.password || !data.referenceCode) {
        return { success: false, error: "Missing required fields" }
    }

    const passwordCheck = passwordSchema.safeParse(data.password)
    if (!passwordCheck.success) {
        return { success: false, error: passwordCheck.error.issues[0].message }
    }

    try {
        // Check if user exists
        const existing = await sql`
      SELECT id FROM customers WHERE email = ${data.email}
    ` as Customer[]

        if (existing.length > 0) {
            return { success: false, error: "Email already registered" }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 10)

        // Create customer
        const customers = await sql`
      INSERT INTO customers (email, password_hash, name)
      VALUES (${data.email}, ${passwordHash}, ${data.name || data.email.split('@')[0]})
      RETURNING id
    ` as Customer[]

        const customerId = customers[0].id

        // Link the order
        await sql`
      UPDATE orders
      SET customer_id = ${customerId}
      WHERE reference_code = ${data.referenceCode}
    `

        // Migrate session wishlist to new account
        await migrateWishlistToAccount(customerId)

        // Return success — NO plaintext password echoed back
        return { success: true, customerId }
    } catch (error) {
        console.error("Account creation error:", error)
        return { success: false, error: "Failed to create account" }
    }
}

async function ensureCustomerPasswordResetsTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS customer_password_resets (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            token TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `
}

export async function requestCustomerPasswordReset(email: string) {
    if (!email || !email.includes("@")) {
        return { success: false, error: "Please enter a valid email address" }
    }

    try {
        await ensureCustomerPasswordResetsTable()

        const customers = await sql`
            SELECT id, email FROM customers WHERE email = ${email}
        ` as Customer[]

        // Anti-enumeration: always return success so attackers cannot probe for registered emails
        if (customers.length === 0) {
            return {
                success: true,
                message: "If an account exists with this email, you will receive password reset instructions.",
            }
        }

        const customer = customers[0]
        const token = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

        // Clear any old active tokens for this customer
        await sql`
            DELETE FROM customer_password_resets WHERE customer_id = ${customer.id}
        `

        await sql`
            INSERT INTO customer_password_resets (customer_id, token, expires_at)
            VALUES (${customer.id}, ${token}, ${expiresAt})
        `

        // Send customer email
        await sendCustomerPasswordResetEmail(customer.email, token)

        return {
            success: true,
            message: "If an account exists with this email, you will receive password reset instructions.",
        }
    } catch (error) {
        console.error("Password reset request error:", error)
        return { success: false, error: "Failed to process request. Please try again." }
    }
}

export async function resetCustomerPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
        return { success: false, error: "Token and password are required" }
    }

    const passwordCheck = passwordSchema.safeParse(newPassword)
    if (!passwordCheck.success) {
        return { success: false, error: passwordCheck.error.issues[0].message }
    }

    try {
        await ensureCustomerPasswordResetsTable()

        const resetEntries = await sql`
            SELECT r.*, c.email 
            FROM customer_password_resets r
            JOIN customers c ON c.id = r.customer_id
            WHERE r.token = ${token}
        `

        if (resetEntries.length === 0) {
            return { success: false, error: "Invalid or expired password reset link" }
        }

        const resetEntry = resetEntries[0]
        if (new Date(resetEntry.expires_at) < new Date()) {
            await sql`DELETE FROM customer_password_resets WHERE token = ${token}`
            return { success: false, error: "This password reset link has expired" }
        }

        const passwordHash = await bcrypt.hash(newPassword, 10)

        await sql`
            UPDATE customers 
            SET password_hash = ${passwordHash}, updated_at = NOW()
            WHERE id = ${resetEntry.customer_id}
        `

        // Delete used token
        await sql`DELETE FROM customer_password_resets WHERE token = ${token}`

        return { success: true }
    } catch (error) {
        console.error("Reset password error:", error)
        return { success: false, error: "Failed to reset password. Please try again." }
    }
}

