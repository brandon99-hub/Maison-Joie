// Browser-only helper — composites up to 4 product images into a 2x2 collage
// (Spotify-playlist-cover style) for use as a bundle's default image when the
// admin hasn't uploaded their own photo. Must only be called client-side.

const CANVAS_SIZE = 512
const CELL_SIZE = CANVAS_SIZE / 2

function loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = url
    })
}

// Draw `img` into the destination square, center-cropping so it fills the
// square without distortion (equivalent to CSS object-fit: cover).
function drawCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    size: number
) {
    const scale = Math.max(size / img.width, size / img.height)
    const sw = size / scale
    const sh = size / scale
    const sx = (img.width - sw) / 2
    const sy = (img.height - sh) / 2
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, size, size)
}

// Cycle through `items` to produce exactly `count` entries (repeats from the
// start once exhausted), matching how Spotify fills a 2x2 grid when a
// playlist has fewer than 4 distinct covers.
function fillTo<T>(items: T[], count: number): T[] {
    const result: T[] = []
    for (let i = 0; i < count; i++) {
        result.push(items[i % items.length])
    }
    return result
}

/**
 * Builds a 2x2 collage Blob from up to 4 product image URLs.
 * - 0 usable images -> null (caller should fall back to no image)
 * - 1 usable image -> that image alone, no grid
 * - 2-3 usable images -> cycled to fill all 4 quadrants
 * - 4+ usable images -> first 4, one per quadrant
 */
export async function buildCollageBlob(imageUrls: string[]): Promise<Blob | null> {
    const candidates = imageUrls.slice(0, 4)
    const loaded = (await Promise.all(candidates.map(loadImage))).filter(
        (img): img is HTMLImageElement => img !== null
    )

    if (loaded.length === 0) return null

    const canvas = document.createElement("canvas")
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    if (loaded.length === 1) {
        drawCover(ctx, loaded[0], 0, 0, CANVAS_SIZE)
    } else {
        const quadrants = fillTo(loaded, 4)
        const positions = [
            [0, 0],
            [CELL_SIZE, 0],
            [0, CELL_SIZE],
            [CELL_SIZE, CELL_SIZE],
        ]
        quadrants.forEach((img, i) => {
            const [dx, dy] = positions[i]
            drawCover(ctx, img, dx, dy, CELL_SIZE)
        })
    }

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9)
    })
}
