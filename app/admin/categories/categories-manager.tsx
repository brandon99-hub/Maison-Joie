"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2, GripVertical, Tag, X, Loader2, AlertTriangle, Upload } from "lucide-react"
import type { Category } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import Image from "next/image"
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
import { createCategory, updateCategory, deleteCategory } from "./actions"
import { toast } from "sonner"

export function CategoriesManager({ categories: initialCategories }: { categories: Category[] }) {
    const [categories, setCategories] = useState(initialCategories)
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [loading, setLoading] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        image: "",
        is_active: true
    })

    const resetForm = () => {
        setFormData({
            name: "",
            slug: "",
            description: "",
            image: "",
            is_active: true
        })
        setEditingCategory(null)
    }

    const handleEdit = (category: Category) => {
        setEditingCategory(category)
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || "",
            image: category.image || "",
            is_active: category.is_active
        })
        setShowForm(true)
    }

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: editingCategory ? prev.slug : generateSlug(name)
        }))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            e.target.value = ""
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5MB")
            e.target.value = ""
            return
        }

        setUploadingImage(true)
        const data = new FormData()
        data.append("file", file)

        try {
            const res = await fetch("/api/upload", { method: "POST", body: data })
            const json = await res.json()
            if (json.success) {
                setFormData(prev => ({ ...prev, image: json.url }))
                toast.success("Image uploaded")
            } else {
                toast.error(json.error || "Failed to upload image")
            }
        } catch (err) {
            console.error(err)
            toast.error("Failed to upload image")
        } finally {
            setUploadingImage(false)
            e.target.value = ""
        }
    }

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: "" }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const form = new FormData()
        form.append("name", formData.name)
        form.append("slug", formData.slug)
        form.append("description", formData.description)
        form.append("image", formData.image)
        if (formData.is_active) form.append("is_active", "on")

        let result
        if (editingCategory) {
            form.append("id", editingCategory.id.toString())
            result = await updateCategory(form)
        } else {
            result = await createCategory(form)
        }

        if (result.success) {
            toast.success(editingCategory ? "Category updated" : "Category created")
            setShowForm(false)
            resetForm()
            window.location.reload()
        } else {
            toast.error(result.error || "Something went wrong")
        }
        setLoading(false)
    }

    const openDeleteModal = (id: number, name: string) => {
        setCategoryToDelete({ id, name })
        setDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!categoryToDelete) return

        const res = await deleteCategory(categoryToDelete.id)
        if (res.success) {
            toast.success("Category deleted")
            setCategories(categories.filter(c => c.id !== categoryToDelete.id))
        } else {
            toast.error(res.error || "Failed to delete")
        }

        setDeleteModalOpen(false)
        setCategoryToDelete(null)
    }

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div>
            <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm() }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
                        <DialogDescription>
                            {editingCategory ? "Update this category's details." : "Add a new category to organize your catalog."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Category Details</h3>

                            <div>
                                <Label>Category Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    required
                                    placeholder="e.g. Eau de Parfum"
                                />
                            </div>

                            <div>
                                <Label>Slug *</Label>
                                <Input
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    required
                                    placeholder="eau-de-parfum"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Used in URLs. Auto-generated from name.
                                </p>
                            </div>

                            <div>
                                <Label>Description (Optional)</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Describe this category..."
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-6 border-t border-border">
                            <Label>Category Image</Label>

                            {formData.image ? (
                                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                                    <Image
                                        src={formData.image}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                                        aria-label="Remove image"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="text-center p-2">
                                        {uploadingImage ? (
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                        ) : (
                                            <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                                        )}
                                        <span className="text-xs text-muted-foreground">Upload photo</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                    />
                                </label>
                            )}

                            <p className="text-xs text-muted-foreground">
                                Recommended: 800x400px (16:9 ratio)
                            </p>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                            <div>
                                <Label className="text-sm">Active Status</Label>
                                <p className="text-xs text-muted-foreground">Inactive categories are hidden from the store.</p>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={c => setFormData({ ...formData, is_active: c })}
                            />
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-col sm:justify-start gap-2 pt-4 border-t border-border">
                            <Button type="submit" disabled={loading} className="w-full min-w-[120px]">
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingCategory ? "Save Changes" : "Create Category"}
                            </Button>
                            <Button type="button" variant="outline" className="w-full" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AdminPageHeader
                title="Categories"
                description={`${categories.length} total categories registered`}
                actions={
                    <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" /> Add Category
                    </Button>
                }
            />

            <div className="flex items-center gap-4 mb-6 bg-card p-2 rounded-lg border border-border">
                <Search className="w-4 h-4 text-muted-foreground ml-2" />
                <Input
                    className="border-none shadow-none focus-visible:ring-0"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {filteredCategories.map(category => (
                    <div
                        key={category.id}
                        className={`bg-card border rounded-xl p-4 transition-all hover:shadow-md ${!category.is_active ? 'opacity-60 bg-muted/40' : ''}`}
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <GripVertical className="hidden sm:block w-5 h-5 text-muted-foreground cursor-move" />

                                {/* Category Image Thumbnail */}
                                {category.image && (
                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-border flex-shrink-0 shadow-sm bg-muted">
                                        <Image
                                            src={category.image}
                                            alt={category.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0 sm:hidden">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold truncate">{category.name}</h3>
                                        {!category.is_active && (
                                            <span className="text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border">Inactive</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">/{category.slug}</p>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 hidden sm:block">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{category.name}</h3>
                                    {!category.is_active && (
                                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded border border-border">Inactive</span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">/{category.slug}</p>
                            </div>

                            <div className="w-full sm:w-auto flex flex-col gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                                {category.description && (
                                    <p className="text-sm text-muted-foreground mb-2 sm:hidden line-clamp-2">{category.description}</p>
                                )}
                                <div className="flex items-center justify-between sm:justify-end gap-2">
                                    <div className="sm:hidden flex items-center gap-1 text-muted-foreground">
                                        <GripVertical className="w-4 h-4" />
                                        <span className="text-xs">Drag</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(category)} className="h-9 px-3">
                                            <Pencil className="w-3 h-3 mr-2" /> Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-9 w-9"
                                            onClick={() => openDeleteModal(category.id, category.name)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {category.description && (
                            <p className="hidden sm:block text-sm text-muted-foreground mt-3 pt-3 border-t border-border/40">
                                {category.description}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {filteredCategories.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No categories found matching "{searchTerm}"
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete "{categoryToDelete?.name}"?
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            This action cannot be undone. If products are using this category, deletion will be prevented.
                        </p>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete Category
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
