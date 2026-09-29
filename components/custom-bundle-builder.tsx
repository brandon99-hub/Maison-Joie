"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Check, Package, AlertCircle, Search, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { useCart } from "@/providers"
import { toast } from "sonner"
import { useCategories } from "@/hooks/use-categories"

interface Product {
    id: number
    name: string
    price: number
    images: string[]
    category: string
    stock_quantity: number
}

interface CustomBundleBuilderProps {
    products: Product[]
}

export function CustomBundleBuilder({ products }: CustomBundleBuilderProps) {
    const [selectedProducts, setSelectedProducts] = useState<number[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false)
    const { addItem } = useCart()
    const { categories } = useCategories()

    // Filter products based on search and category
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
            return matchesSearch && matchesCategory
        })
    }, [products, searchQuery, categoryFilter])

    // Calculate totals
    const selectedItems = products.filter(p => selectedProducts.includes(p.id))
    const originalTotal = selectedItems.reduce((sum, p) => sum + Number(p.price || 0), 0)

    // Discount tiers based on quantity
    const getDiscountPercent = (count: number) => {
        if (count >= 4) return 20
        if (count === 3) return 15
        if (count === 2) return 10
        return 0
    }

    const discountPercent = getDiscountPercent(selectedProducts.length)
    const discountAmount = Math.round(originalTotal * (discountPercent / 100))
    const finalPrice = originalTotal - discountAmount

    const isValidBundle = selectedProducts.length >= 2

    const toggleProduct = (productId: number) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        )
    }

    const handleAddToCart = () => {
        if (!isValidBundle) return

        // Use the first selected product's image to represent the bundle
        const randomImage = selectedItems.find(p => p.images?.[0])?.images?.[0] || ""

        // Calculate discounted price per item
        const discountMultiplier = 1 - (discountPercent / 100)
        const discountedPricePerItem = finalPrice / selectedItems.length

        // Add each product individually with bundle discount applied
        selectedItems.forEach(product => {
            addItem({
                product_id: product.id,
                name: product.name,
                price: Math.round(product.price * discountMultiplier), // Apply discount to price
                image: randomImage, // Use random default bundle image
                quantity: 1,
                is_bundle: true,
            })
        })

        // Clear selection first
        setSelectedProducts([])

        // Show success toast with bundle details after a brief delay
        setTimeout(() => {
            toast.success(
                `Bundle added to cart! 🎉`,
                {
                    description: `${selectedItems.length} items • Save KES ${discountAmount.toLocaleString()} (${discountPercent}% off)`,
                    action: {
                        label: "View Cart",
                        onClick: () => window.location.href = "/cart"
                    }
                }
            )
        }, 100)
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            {/* Instructions - Collapsible on Mobile */}
            <div className="border border-border rounded-lg overflow-hidden">
                <button
                    onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
                    className="w-full flex items-center justify-between p-4 bg-muted/30 md:cursor-default"
                >
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <strong>How it works:</strong>
                    </div>
                    <div className="md:hidden">
                        {isHowItWorksOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                </button>
                <div className={`${isHowItWorksOpen ? 'block' : 'hidden'} md:block p-4 pt-2`}>
                    <p className="text-sm mb-2">Select 2+ products to create your bundle.</p>
                    <ul className="space-y-1 text-sm">
                        <li>• 2 items = 10% off</li>
                        <li>• 3 items = 15% off</li>
                        <li>• 4+ items = 20% off</li>
                        <li>• Mix categories or stick to one!</li>
                    </ul>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={categoryFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCategoryFilter("all")}
                    >
                        All Products
                    </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat.id}
                            variant={categoryFilter === cat.slug ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCategoryFilter(cat.slug)}
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Product Selection Grid */}
            <div>
                <h3 className="font-semibold mb-4">Select Products ({selectedProducts.length} selected)</h3>

                {/* Selected Products Pills */}
                {selectedProducts.length > 0 && (
                    <div className="mb-4 p-3 bg-rose-50 rounded-lg border border-rose-200">
                        <p className="text-xs font-medium text-rose-900 mb-2">Selected:</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedItems.map((product) => (
                                <div
                                    key={product.id}
                                    className="inline-flex items-center gap-1.5 bg-white border border-rose-300 rounded-full px-3 py-1.5 text-sm"
                                >
                                    <span className="font-medium text-rose-900">{product.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => toggleProduct(product.id)}
                                        className="text-rose-600 hover:text-rose-800 font-bold"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No products found matching your search.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-4 -mx-4 px-4">
                        <div className="flex gap-4 min-w-min">
                            {filteredProducts.map((product) => {
                                const isSelected = selectedProducts.includes(product.id)
                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => toggleProduct(product.id)}
                                        className={`relative p-4 rounded-xl border-2 text-left transition-all flex-shrink-0 w-48 md:w-56 ${isSelected
                                            ? "border-rose-500 bg-rose-50 shadow-lg scale-105"
                                            : "border-gray-200 hover:border-rose-300 hover:shadow-md"
                                            }`}
                                    >
                                        {/* Checkmark */}
                                        {isSelected && (
                                            <div className="absolute top-3 right-3 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center shadow-md z-10">
                                                <Check className="w-5 h-5 text-white" />
                                            </div>
                                        )}

                                        {/* Product Image */}
                                        <div className="relative h-40 md:h-48 mb-3 bg-gray-100 rounded-lg overflow-hidden">
                                            <Image
                                                src={product.images[0] || "/placeholder.svg"}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {/* Product Info */}
                                        <p className="text-base font-semibold line-clamp-2 mb-2">{product.name}</p>
                                        <p className="text-sm text-rose-600 font-bold mb-1">KES {product.price.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 capitalize">{product.category.replace("-", " ")}</p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Bundle Summary */}
            {selectedProducts.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold">Bundle Summary</h4>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Original Total:</span>
                            <span className="line-through">KES {originalTotal.toLocaleString()}</span>
                        </div>

                        {discountPercent > 0 && (
                            <>
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Discount ({discountPercent}%):</span>
                                    <span>- KES {discountAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t">
                                    <span>Final Price:</span>
                                    <span>KES {finalPrice.toLocaleString()}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Validation Messages */}
                    {selectedProducts.length === 1 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>Select at least 2 products to create a bundle.</AlertDescription>
                        </Alert>
                    )}

                    {/* Add to Cart Button */}
                    <Button
                        onClick={handleAddToCart}
                        disabled={!isValidBundle}
                        className="w-full"
                        size="lg"
                    >
                        {isValidBundle
                            ? `Add Bundle to Cart (Save KES ${discountAmount.toLocaleString()})`
                            : "Select Products to Continue"}
                    </Button>
                </div>
            )}
        </div>
    )
}
