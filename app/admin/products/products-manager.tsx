"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2, Package, Tag, Layers, FileImage, X, Loader2, Upload, LayoutGrid, List } from "lucide-react"
import type { Product, Category } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { cn } from "@/lib/utils"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import Image from "next/image"
import { createProduct, updateProduct, deleteProduct, toggleProductStatus } from "./actions"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ProductsManager({ products: initialProducts, categories }: { products: Product[]; categories: Category[] }) {
    const [products, setProducts] = useState(initialProducts)
    const [showForm, setShowForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [deleteProductId, setDeleteProductId] = useState<number | null>(null)
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        stock_quantity: "",
        category: "",
        images: [] as string[],
        is_active: true,
        is_secret: false,
        secret_discount_percent: ""
    })

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            price: "",
            stock_quantity: "",
            category: "",
            images: [],
            is_active: true,
            is_secret: false,
            secret_discount_percent: ""
        })
        setEditingProduct(null)
    }

    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            stock_quantity: (product.stock_quantity || 0).toString(),
            category: product.category,
            images: product.images,
            is_active: product.is_active,
            is_secret: product.is_secret || false,
            secret_discount_percent: product.secret_discount_percent != null ? product.secret_discount_percent.toString() : ""
        })
        setShowForm(true)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploadingImage(true)
        const newImages = [...formData.images]

        for (let i = 0; i < files.length; i++) {
            const file = files[i]

            if (!file.type.startsWith("image/")) {
                toast.error(`${file.name} is not an image file`)
                continue
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is over 5MB`)
                continue
            }

            const data = new FormData()
            data.append("file", file)

            try {
                const res = await fetch("/api/upload", { method: "POST", body: data })
                const json = await res.json()
                if (json.success) {
                    newImages.push(json.url)
                } else {
                    toast.error(json.error || `Failed to upload ${file.name}`)
                }
            } catch (err) {
                console.error(err)
                toast.error(`Failed to upload ${file.name}`)
            }
        }

        setFormData(prev => ({ ...prev, images: newImages }))
        setUploadingImage(false)
        e.target.value = ""
    }

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const form = new FormData()
        form.append("name", formData.name)
        form.append("description", formData.description)
        form.append("price", formData.price)
        form.append("stock_quantity", formData.stock_quantity)
        form.append("category", formData.category)
        form.append("images", formData.images.join(",")) // Send as comma-separated string, handled in action
        if (formData.is_active) form.append("is_active", "on")
        if (formData.is_secret) form.append("is_secret", "on")
        if (formData.is_secret && formData.secret_discount_percent) {
            form.append("secret_discount_percent", formData.secret_discount_percent)
        }

        let result
        if (editingProduct) {
            form.append("id", editingProduct.id.toString())
            result = await updateProduct(form)
        } else {
            result = await createProduct(form)
        }

        if (result.success) {
            toast.success(editingProduct ? "Product updated" : "Product created")
            setShowForm(false)
            resetForm()
            // Ideally verify with router.refresh() in parent or use optimistic updates, 
            // but for now relying on server action revalidatePath which might need a manual refresh on client sometimes
            window.location.reload()
        } else {
            toast.error(result.error || "Something went wrong")
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!deleteProductId) return
        const res = await deleteProduct(deleteProductId)
        if (res.success) {
            toast.success("Product deleted")
            setProducts(products.filter(p => p.id !== deleteProductId))
        } else {
            toast.error("Failed to delete")
        }
        setDeleteProductId(null)
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div>
            <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm() }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "Edit Product" : "New Product"}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? "Update this product's details, pricing, and images." : "Add a new product to your catalog."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Basic Info</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Product Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="e.g. Midnight Bloom"
                                    />
                                </div>
                                <div>
                                    <Label className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.slug}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    rows={4}
                                    placeholder="Describe your product..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-border">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Inventory & Pricing</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Price (KES)</Label>
                                    <Input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <Label>Stock Quantity</Label>
                                    <Input
                                        type="number"
                                        value={formData.stock_quantity}
                                        onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-border">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className={cn(
                                    "flex items-center justify-between rounded-lg border px-4 py-3 transition-colors",
                                    formData.is_active ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"
                                )}>
                                    <div>
                                        <Label className="text-sm">Active</Label>
                                        <p className={cn("text-xs", formData.is_active ? "text-primary" : "text-muted-foreground")}>
                                            {formData.is_active ? "Visible in store" : "Hidden from store"}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.is_active}
                                        onCheckedChange={c => setFormData({ ...formData, is_active: c })}
                                    />
                                </div>
                                <div className={cn(
                                    "flex items-center justify-between rounded-lg border px-4 py-3 transition-colors",
                                    formData.is_secret ? "border-amber-400/50 bg-amber-50" : "border-border bg-muted/30"
                                )}>
                                    <div>
                                        <Label className="text-sm">🔒 Secret</Label>
                                        <p className={cn("text-xs", formData.is_secret ? "text-amber-700 font-medium" : "text-muted-foreground")}>
                                            {formData.is_secret ? "QR code only" : "Normal product"}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.is_secret}
                                        onCheckedChange={c => setFormData({ ...formData, is_secret: c })}
                                    />
                                </div>
                            </div>

                            {formData.is_secret && (
                                <div className="rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-3 space-y-2">
                                    <Label className="text-sm">Secret Page Discount %</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="e.g. 15"
                                        value={formData.secret_discount_percent}
                                        onChange={e => setFormData({ ...formData, secret_discount_percent: e.target.value })}
                                        className="bg-white"
                                    />
                                    {formData.price && formData.secret_discount_percent && (
                                        <p className="text-xs text-amber-700">
                                            Secret page price: KES{" "}
                                            {Math.round(
                                                Number(formData.price) * (1 - Number(formData.secret_discount_percent) / 100)
                                            ).toLocaleString()}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Only applies on the secret page — the regular shop price is unaffected. Leave blank to use the default discount.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 pt-6 border-t border-border">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><FileImage className="w-3.5 h-3.5" /> Media</h3>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {formData.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                                        <Image src={img} alt="Product" fill className="object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors active:scale-95"
                                            style={{ minWidth: '28px', minHeight: '28px' }}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer active:scale-95">
                                    <div className="text-center p-2">
                                        {uploadingImage ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />}
                                        <span className="text-xs text-muted-foreground">Upload</span>
                                    </div>
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                                </label>
                            </div>
                            <p className="text-xs text-muted-foreground">First image will be the cover.</p>
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-col sm:justify-start gap-2 pt-4 border-t border-border">
                            <Button type="submit" disabled={loading || uploadingImage} className="w-full min-h-[44px]">
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingProduct ? "Save Changes" : "Create Product"}
                            </Button>
                            <Button type="button" variant="outline" className="w-full min-h-[44px]" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AdminPageHeader
                title="Products"
                description={`${products.length} items in inventory`}
                actions={
                    <>
                        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                            <Button
                                size="icon"
                                variant={viewMode === "grid" ? "secondary" : "ghost"}
                                className="h-8 w-8"
                                onClick={() => setViewMode("grid")}
                                aria-label="Grid view"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant={viewMode === "table" ? "secondary" : "ghost"}
                                className="h-8 w-8"
                                onClick={() => setViewMode("table")}
                                aria-label="Table view"
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]">
                            <Plus className="w-4 h-4 mr-2" /> Add Product
                        </Button>
                    </>
                }
            />

            <div className="flex items-center gap-4 mb-6 bg-card p-2 rounded-lg border border-border">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                    className="border-none shadow-none focus-visible:ring-0"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className={`bg-card group border rounded-xl overflow-hidden transition-all hover:shadow-md ${!product.is_active ? 'opacity-60 grayscale' : ''}`}>
                            <div className="relative aspect-[4/3] bg-muted">
                                {product.images[0] ? (
                                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <FileImage className="w-8 h-8 opacity-20" />
                                    </div>
                                )}
                                {!product.is_active && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">Inactive</span>
                                    </div>
                                )}
                                {product.is_secret && (
                                    <div className="absolute top-2 right-2">
                                        <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                            🔒 SECRET
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <div className="mb-2">
                                    <h3 className="font-semibold">{product.name}</h3>
                                    <div className="flex items-center justify-between mt-1 gap-2">
                                        <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                                        <p className="font-bold text-primary whitespace-nowrap">KSh {product.price}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                    <Package className="w-3 h-3" />
                                    <span>{product.stock_quantity} in stock</span>
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t">
                                    <Button variant="outline" size="sm" className="flex-1 min-h-[44px]" onClick={() => handleEdit(product)}>
                                        <Pencil className="w-3 h-3 mr-2" /> Edit
                                    </Button>
                                    <Button variant="destructive" size="icon" className="min-w-[44px] min-h-[44px]" onClick={() => setDeleteProductId(product.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map(product => (
                                <TableRow key={product.id} className={!product.is_active ? "opacity-60" : ""}>
                                    <TableCell>
                                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                                            {product.images[0] ? (
                                                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                                    <FileImage className="w-4 h-4 opacity-20" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-normal max-w-xs">{product.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{product.category}</TableCell>
                                    <TableCell className="font-semibold text-primary">KSh {product.price}</TableCell>
                                    <TableCell>{product.stock_quantity}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {product.is_active ? (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                                            ) : (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>
                                            )}
                                            {product.is_secret && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">🔒 Secret</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => setDeleteProductId(product.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No products found matching "{searchTerm}"
                </div>
            )}

            <AlertDialog open={deleteProductId !== null} onOpenChange={(open) => !open && setDeleteProductId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this product
                            from your inventory and remove it from the store.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Product
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
