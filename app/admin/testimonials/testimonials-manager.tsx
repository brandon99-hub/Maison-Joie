"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Plus, Trash2, Loader2, Pencil, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import type { Testimonial } from "@/lib/db"
import { addTestimonial, deleteTestimonial, updateTestimonial, toggleApproval } from "./actions"

export function TestimonialsManager({ testimonials }: { testimonials: Testimonial[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)

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
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.success) {
        setImageUrl(data.url)
      } else {
        toast.error(data.error || "Failed to upload image")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to upload image")
    } finally {
      setUploadingImage(false)
      e.target.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    if (editingTestimonial) {
      formData.append("id", editingTestimonial.id.toString())
      await updateTestimonial(formData)
    } else {
      await addTestimonial(formData)
    }

    setShowForm(false)
    setLoading(false)
    setImageUrl("")
    setEditingTestimonial(null)
    router.refresh()
  }

  const handleEdit = (t: Testimonial) => {
    setEditingTestimonial(t)
    setImageUrl(t.profile_image)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTestimonial(null)
    setImageUrl("")
  }

  const handleDelete = async (id: number) => {
    setDeleting(id)
    await deleteTestimonial(id)
    router.refresh()
    setDeleting(null)
  }

  return (
    <div>
      <AdminPageHeader
        title="Testimonials"
        description="Review, approve, and showcase authentic customer reviews and social proof."
        actions={
          <Button onClick={() => {
            setEditingTestimonial(null)
            setImageUrl("")
            setShowForm(true)
          }} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Add Testimonial
          </Button>
        }
      />

      {/* Add/Edit Modal */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) handleCancel(); else setShowForm(true) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "New Testimonial"}</DialogTitle>
            <DialogDescription>
              {editingTestimonial ? "Update this customer testimonial." : "Add a customer testimonial to showcase on the storefront."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="@username"
                required
                className="mt-1"
                defaultValue={editingTestimonial?.username || ""}
              />
            </div>

            <div className="space-y-3">
              <Label>Profile Image</Label>
              <Input id="profile_image" name="profile_image" type="hidden" value={imageUrl} />

              {imageUrl ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden border border-border">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-0 right-0 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
                  {uploadingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="What they said..."
                required
                className="mt-1"
                rows={3}
                defaultValue={editingTestimonial?.message || ""}
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-col sm:justify-start gap-2 pt-4 border-t border-border">
              <Button type="submit" disabled={loading || uploadingImage} className="w-full bg-primary hover:bg-primary/90">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingTestimonial ? "Update" : "Add")}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} className="w-full bg-transparent hover:bg-muted">
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Testimonials list */}
      <div className="space-y-4">
        {testimonials.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-xl p-4 overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <Image
                    src={t.profile_image || "/pfp.jpg"}
                    alt={t.username}
                    width={40}
                    height={40}
                    className="rounded-full object-cover border border-border"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">@{t.username}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {t.is_approved ? '✓ Approved' : '⏳ Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{t.message}</p>
                  {t.emoji_reactions && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-1.5 rounded inline-block">Reactions: {t.emoji_reactions}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2 w-full lg:w-auto shrink-0">
                <button
                  onClick={async () => {
                    await toggleApproval(t.id, t.is_approved)
                    router.refresh()
                  }}
                  className={`flex-1 lg:w-24 px-3 py-2 text-xs font-medium rounded-md transition-colors text-center ${t.is_approved ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                >
                  {t.is_approved ? 'Unapprove' : 'Approve'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(t)}
                    disabled={deleting === t.id}
                    className="p-2 rounded-md border border-border text-muted-foreground hover:text-primary hover:bg-muted transition-colors flex justify-center items-center h-9 w-9"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    className="p-2 rounded-md border border-border text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors flex justify-center items-center h-9 w-9"
                    title="Delete"
                  >
                    {deleting === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {testimonials.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No testimonials yet</div>
        )}
      </div>
    </div>
  )
}
