// Injects Cloudinary's automatic-format/automatic-quality transform into an
// existing Cloudinary delivery URL, so images are served as already-optimized
// WebP/AVIF without needing Next.js's own (disabled) image optimizer.
// Non-Cloudinary URLs (e.g. /placeholder.svg) are returned unchanged.
export function optimizeCloudinaryUrl(url: string): string {
    if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
        return url
    }
    return url.replace("/upload/", "/upload/f_auto,q_auto/")
}
