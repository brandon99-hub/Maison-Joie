import { sql, type Testimonial } from "@/lib/db"
import TestimonialsPage from "./testimonials-page"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Customer Reviews | MAISON JOIE",
  description: "Real experiences from Maison Joie customers — see what people are saying about our perfumes and fragrances.",
}

export default async function Testimonials() {
  // Show all approved testimonials (both customer and non-customer)
  // Customer testimonials will have customer_id and show "Verified" badge
  const testimonials = await sql`
    SELECT t.*, c.name as customer_name, c.email
    FROM testimonials t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.is_approved = true 
    ORDER BY t.created_at DESC
  ` as unknown as Testimonial[]

  return <TestimonialsPage testimonials={testimonials} />
}
