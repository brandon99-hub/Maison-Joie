import { v2 as cloudinary } from "cloudinary"
import { NextRequest, NextResponse } from "next/server"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ success: false, error: "File must be a JPEG, PNG, WEBP, or GIF image" })
    }

    if (file.size > MAX_SIZE) {
        return NextResponse.json({ success: false, error: "Image must be under 5MB" })
    }

    try {
        const bytes = await file.arrayBuffer()
        const base64 = Buffer.from(bytes).toString("base64")
        const dataUri = `data:${file.type};base64,${base64}`

        const result = await cloudinary.uploader.upload(dataUri, {
            folder: "maison-joie",
            resource_type: "image",
        })

        return NextResponse.json({ success: true, url: result.secure_url })
    } catch (error) {
        console.error("Error uploading file:", error)
        return NextResponse.json({ success: false, error: "Failed to upload file" })
    }
}
