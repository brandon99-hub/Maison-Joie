"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { SearchInputWithAutocomplete } from "@/components/search-input-autocomplete"
import { ProductFiltersImproved, type FilterState } from "@/components/product-filters-improved"
import { ActiveFilters, type ActiveFilter } from "@/components/active-filters"
import type { Product } from "@/lib/db"

interface ShopClientProps {
    initialProducts: Product[]
    maxPrice: number
}

export function ShopClient({ initialProducts, maxPrice }: ShopClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initialize filters from URL
    const [filters, setFilters] = useState<FilterState>({
        priceMin: parseInt(searchParams.get("priceMin") || "0"),
        priceMax: parseInt(searchParams.get("priceMax") || maxPrice.toString()),
        categories: searchParams.get("categories")?.split(",").filter(Boolean) ||
            (searchParams.get("category") ? [searchParams.get("category")!] : []),
        inStockOnly: searchParams.get("inStock") === "true",
        sortBy: searchParams.get("sort") || "newest",
    })

    const [filteredProducts, setFilteredProducts] = useState(initialProducts)

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()

        if (filters.priceMin > 0) params.set("priceMin", filters.priceMin.toString())
        if (filters.priceMax < maxPrice) params.set("priceMax", filters.priceMax.toString())
        if (filters.categories.length > 0) params.set("categories", filters.categories.join(","))
        if (filters.inStockOnly) params.set("inStock", "true")
        if (filters.sortBy !== "newest") params.set("sort", filters.sortBy)

        const queryString = params.toString()
        router.push(`/shop${queryString ? `?${queryString}` : ""}`, { scroll: false })
    }, [filters, maxPrice, router])

    // Apply filters
    useEffect(() => {
        let result = [...initialProducts]

        // Price filter
        result = result.filter(
            (p) => p.price >= filters.priceMin && p.price <= filters.priceMax
        )

        // Category filter
        if (filters.categories.length > 0) {
            result = result.filter((p) => filters.categories.includes(p.category))
        }

        // Stock filter
        if (filters.inStockOnly) {
            result = result.filter((p) => (p.stock_quantity || 0) > 0)
        }

        // Sort
        switch (filters.sortBy) {
            case "price-asc":
                result.sort((a, b) => a.price - b.price)
                break
            case "price-desc":
                result.sort((a, b) => b.price - a.price)
                break
            case "popular":
                result.sort((a, b) => (b.wishlist_count || 0) - (a.wishlist_count || 0))
                break
            case "newest":
            default:
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                break
        }

        setFilteredProducts(result)
    }, [filters, initialProducts])

    // Build active filters list
    const activeFilters: ActiveFilter[] = []

    if (filters.priceMin > 0 || filters.priceMax < maxPrice) {
        activeFilters.push({
            type: "price",
            label: `KES ${filters.priceMin.toLocaleString()} - ${filters.priceMax.toLocaleString()}`,
            value: `${filters.priceMin}-${filters.priceMax}`,
        })
    }

    filters.categories.forEach((cat) => {
        activeFilters.push({
            type: "category",
            label: cat.replace("-", " "),
            value: cat,
        })
    })

    if (filters.inStockOnly) {
        activeFilters.push({
            type: "stock",
            label: "In Stock Only",
            value: "true",
        })
    }

    const handleRemoveFilter = (filter: ActiveFilter) => {
        if (filter.type === "price") {
            setFilters({ ...filters, priceMin: 0, priceMax: maxPrice })
        } else if (filter.type === "category") {
            setFilters({
                ...filters,
                categories: filters.categories.filter((c) => c !== filter.value),
            })
        } else if (filter.type === "stock") {
            setFilters({ ...filters, inStockOnly: false })
        }
    }

    const handleClearAll = () => {
        setFilters({
            priceMin: 0,
            priceMax: maxPrice,
            categories: [],
            inStockOnly: false,
            sortBy: "newest",
        })
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Search and Filters */}
            <div className="mb-6">
                <ProductFiltersImproved
                    filters={filters}
                    onFiltersChange={setFilters}
                    maxPrice={maxPrice}
                    searchInput={<SearchInputWithAutocomplete className="max-w-none mx-0" />}
                />
            </div>

            {/* Active Filters */}
            <ActiveFilters
                filters={activeFilters}
                onRemove={handleRemoveFilter}
                onClearAll={handleClearAll}
            />

            {/* Results Count */}
            <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                    Showing {filteredProducts.length} of {initialProducts.length} products
                </p>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : initialProducts.length === 0 ? (
                <div className="text-center py-12">
                    <Sparkles className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No products yet — new fragrances coming soon!</p>
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No products match your filters</p>
                    <button
                        onClick={handleClearAll}
                        className="mt-4 text-primary hover:underline"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    )
}
