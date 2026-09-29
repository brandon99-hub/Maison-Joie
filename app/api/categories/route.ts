import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

// Always run at request time — never bake a failed/empty DB fetch into a
// build-time static snapshot (see catch block below).
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const categories = await sql`
          SELECT * FROM categories 
          WHERE is_active = true 
          ORDER BY display_order ASC, name ASC
        `
        return NextResponse.json(categories, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
        })
    } catch (error) {
        console.error('Error fetching categories (using fallback empty array):', error)
        // Return empty array instead of hard 500 error during Neon cold starts / connection timeouts
        return NextResponse.json([], {
            headers: {
                "Cache-Control": "no-store",
            },
        })
    }
}
