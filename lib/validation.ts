import { z } from "zod"

// Order validation schema
export const orderSchema = z.object({
    customerName: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name is too long"),
    phoneNumber: z
        .string()
        .regex(/^(07|01)\d{8}$/, "Invalid Kenyan phone number (e.g., 0712345678)"),
    pickupLocation: z
        .string()
        .min(3, "Please provide a valid pickup location"),
    deliveryMethod: z.enum(["self-pickup", "pickup-mtaani", "door-to-door"]).optional(),
    deliveryFee: z.number().min(0).default(0),
    pickupMtaaniLocationId: z.number().optional(),
    address_type: z.string().optional(),
    estate_name: z.string().optional(),
    house_number: z.string().optional(),
    landmark: z.string().optional(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    items: z
        .array(
            z.object({
                product_id: z.number(),
                name: z.string(),
                quantity: z.number().min(1, "Quantity must be at least 1"),
                price: z.number().positive("Price must be positive"),
                image: z.string(),
            })
        )
        .min(1, "Cart cannot be empty"),
    totalAmount: z.number().positive("Total amount must be positive"),
    secretCode: z.string().optional(),
})

// Product review validation schema
export const reviewSchema = z.object({
    product_id: z.number(),
    customer_name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name is too long"),
    rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
    review_text: z
        .string()
        .max(1000, "Review is too long (max 1000 characters)")
        .optional(),
})

// Shared password strength rule for every password-creation flow
export const passwordSchema = z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[a-z]/, "One lowercase letter")
    .regex(/[A-Z]/, "One uppercase letter")
    .regex(/[0-9]/, "One number")

// Product search/filter schema
export const productFilterSchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().positive().optional(),
    inStockOnly: z.boolean().optional(),
    sortBy: z
        .enum(["newest", "price-asc", "price-desc", "name-asc"])
        .optional(),
})

// Type exports for TypeScript
export type OrderInput = z.infer<typeof orderSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type ProductFilter = z.infer<typeof productFilterSchema>
