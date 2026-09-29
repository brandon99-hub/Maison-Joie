"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Clock, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface SearchResult {
    id: number
    name: string
    slug: string
    price: number
    image: string
    stock_quantity: number
    category: string
}

const SEARCH_HISTORY_KEY = "glossyke_search_history"
const MAX_HISTORY = 5

interface SearchInputWithAutocompleteProps {
    className?: string
}

export function SearchInputWithAutocomplete({ className }: SearchInputWithAutocompleteProps = {}) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [searchHistory, setSearchHistory] = useState<string[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Load search history from localStorage
    useEffect(() => {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY)
        if (history) {
            setSearchHistory(JSON.parse(history))
        }
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const fetchResults = useDebouncedCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(searchQuery)}`)
            const data = await response.json()
            if (data.success) {
                setResults(data.results)
            }
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setIsLoading(false)
        }
    }, 300)

    const handleInputChange = (value: string) => {
        setQuery(value)
        setIsOpen(true)
        if (value.length >= 2) {
            fetchResults(value)
        } else {
            setResults([])
        }
    }

    const saveToHistory = (searchTerm: string) => {
        const newHistory = [searchTerm, ...searchHistory.filter((h) => h !== searchTerm)].slice(0, MAX_HISTORY)
        setSearchHistory(newHistory)
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
    }

    const handleProductClick = (product: SearchResult) => {
        saveToHistory(product.name)
        setIsOpen(false)
        setQuery("")
        router.push(`/product/${product.slug}`)
    }

    const handleHistoryClick = (term: string) => {
        setQuery(term)
        fetchResults(term)
    }

    const clearHistory = () => {
        setSearchHistory([])
        localStorage.removeItem(SEARCH_HISTORY_KEY)
    }

    const handleClear = () => {
        setQuery("")
        setResults([])
        setIsOpen(false)
    }

    const showHistory = isOpen && query.length < 2 && searchHistory.length > 0
    const showResults = isOpen && results.length > 0

    return (
        <div ref={wrapperRef} className={cn("relative w-full max-w-2xl mx-auto", className)}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                    type="text"
                    className="w-full pl-10 pr-10 py-3 border border-border rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Search for perfumes, scents..."
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {(showHistory || showResults) && (
                <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                    {/* Search History */}
                    {showHistory && (
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Recent Searches</span>
                                <button onClick={clearHistory} className="text-xs text-primary hover:underline">
                                    Clear
                                </button>
                            </div>
                            <div className="space-y-1">
                                {searchHistory.map((term, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleHistoryClick(term)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                                    >
                                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm">{term}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {showResults && (
                        <div className="p-2">
                            {isLoading && (
                                <div className="text-center py-4 text-sm text-muted-foreground">Searching...</div>
                            )}
                            {!isLoading && results.length > 0 && (
                                <div className="space-y-1">
                                    {results.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => handleProductClick(product)}
                                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                                        >
                                            {/* Product Image */}
                                            <div className="relative w-12 h-12 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                                                <Image src={product.image} alt={product.name} fill className="object-cover" />
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{product.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="font-semibold text-primary">KES {product.price.toLocaleString()}</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{product.category.replace("-", " ")}</span>
                                                </div>
                                            </div>

                                            {/* Stock Status */}
                                            {product.stock_quantity === 0 && (
                                                <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                                            )}
                                            {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                                                <span className="text-xs text-amber-600 font-medium">Low Stock</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* No Results */}
                    {!isLoading && query.length >= 2 && results.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No products found for &quot;{query}&quot;
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
