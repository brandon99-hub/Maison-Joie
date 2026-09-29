import { redirect } from "next/navigation"
import { sql, type Testimonial } from "@/lib/db"
import { TestimonialsManager } from "./testimonials-manager"
import { verifyAdminSession } from "@/lib/admin-auth"

export default async function AdminTestimonialsPage() {
  const isLoggedIn = await verifyAdminSession()

  if (!isLoggedIn) {
    redirect("/admin/login")
  }

  const testimonials = await sql`
    SELECT * FROM testimonials 
    ORDER BY created_at DESC
  ` as unknown as Testimonial[]

  return (
    <div className="p-6 md:p-8">
      <TestimonialsManager testimonials={testimonials} />
    </div>
  )
}
