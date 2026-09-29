"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { submitTestimonial } from "@/app/testimonials/actions"
import Image from "next/image"

const EMOJI_OPTIONS = [
    { key: "fire", emoji: "🔥", label: "Fire" },
    { key: "heart", emoji: "❤️", label: "Love" },
    { key: "sparkles", emoji: "✨", label: "Sparkles" },
    { key: "crying", emoji: "😭", label: "Crying" },
    { key: "heart_eyes", emoji: "😍", label: "Heart Eyes" },
    { key: "hundred", emoji: "💯", label: "100" },
    { key: "skull", emoji: "💀", label: "Skull" },
    { key: "money", emoji: "💸", label: "Money" },
]

interface TestimonialFormProps {
    onClose: () => void
    onSuccess: () => void
}

export function TestimonialForm({ onClose, onSuccess }: TestimonialFormProps) {
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState("")
    const [message, setMessage] = useState("")
    const [selectedEmojis, setSelectedEmojis] = useState<string[]>([])
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const toggleEmoji = (key: string) => {
        setSelectedEmojis((prev) =>
            prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData()
            formData.append("username", username)
            formData.append("message", message)
            formData.append("emoji_reactions", selectedEmojis.join(","))
            if (imageFile) {
                formData.append("profile_image", imageFile)
            }

            const result = await submitTestimonial(formData)

            if (result.success) {
                toast.success("Thank you! Your testimonial is pending approval 💕")
                onSuccess()
                onClose()
            } else {
                toast.error(result.error || "Failed to submit testimonial")
            }
        } catch (error) {
            console.error(error)
            toast.error("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-400/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-400/20 to-transparent rounded-full blur-3xl" />

                {/* Header */}
                <div className="relative flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-rose-500" />
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                            Share Your Love
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 relative">
                    {/* Profile Image Upload */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700">Profile Picture (Optional)</Label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-rose-200 to-amber-200 flex items-center justify-center">
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                ) : (
                                    <Upload className="w-6 h-6 text-gray-500" />
                                )}
                            </div>
                            <label className="cursor-pointer">
                                <span className="text-sm text-rose-600 hover:text-rose-700 font-medium">
                                    Upload Photo
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={loading}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Username */}
                    <div>
                        <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                            Your Username
                        </Label>
                        <div className="relative mt-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="yourname"
                                required
                                maxLength={30}
                                className="pl-7 bg-white/80 backdrop-blur border-rose-200 focus:border-rose-400"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                            Your Message
                        </Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tell us what you love about Maison Joie..."
                            required
                            maxLength={280}
                            rows={4}
                            className="mt-2 bg-white/80 backdrop-blur border-rose-200 focus:border-rose-400 resize-none"
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">{message.length}/280</p>
                    </div>

                    {/* Emoji Reactions */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Add Reactions (Optional)
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {EMOJI_OPTIONS.map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => toggleEmoji(option.key)}
                                    className={`text-2xl p-2 rounded-xl transition-all ${selectedEmojis.includes(option.key)
                                            ? "bg-gradient-to-br from-rose-400 to-amber-400 scale-110 shadow-lg"
                                            : "bg-white/60 hover:bg-white/80 hover:scale-105"
                                        }`}
                                    disabled={loading}
                                    title={option.label}
                                >
                                    {option.emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold py-6 rounded-xl shadow-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Submit Testimonial
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-gray-600">
                        Your testimonial will be reviewed before appearing on the site
                    </p>
                </form>
            </motion.div>
        </motion.div>
    )
}
