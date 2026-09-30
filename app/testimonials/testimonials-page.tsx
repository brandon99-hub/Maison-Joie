"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import type { Testimonial } from "@/lib/db"
import { useState } from "react"
import { submitTestimonial } from "./actions"
import { toast } from "sonner"
import { Send, Loader2, Star, ChevronDown, LogIn, ShoppingBag } from "lucide-react"
import { useSession } from "next-auth/react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const emojiMap: Record<string, string> = {
  fire: "🔥",
  heart: "❤️",
  sparkles: "✨",
  crying: "😭",
  gift: "🎁",
  laughing: "😂",
  hundred: "💯",
  skull: "💀",
  money: "💸",
  heart_eyes: "😍",
}

const TestimonialsPage = ({ testimonials }: { testimonials: Testimonial[] }) => {
  const { data: session } = useSession()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user) {
      toast.error("Please login to leave a testimonial")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("message", message)

      const result = await submitTestimonial(formData)

      if (result.success) {
        toast.success("Thanks for sharing the love! 💕 Your testimonial is now live!")
        setMessage("")
        setIsFormOpen(false)
      } else {
        toast.error(result.error || "Failed to submit")
      }
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8 px-4 pb-24">
      <div className="container mx-auto max-w-lg">
        <h1 className="text-3xl font-bold mb-2 text-center">What Our Customers Say</h1>
        <p className="text-muted-foreground text-center mb-8">Real experiences, shared by our community</p>

        <div className="space-y-4 mb-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-muted rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <Image
                  src={t.profile_image || "/placeholder.svg?height=60&width=60"}
                  alt={t.username}
                  width={44}
                  height={44}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">@{t.username}</p>
                    {/* Only show verified badge for customer testimonials */}
                    {t.customer_id && (
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium shadow-sm">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="bg-background rounded-2xl rounded-tl-none px-4 py-3 mt-2 shadow-sm">
                    <p className="text-sm leading-relaxed">{t.message}</p>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {t.emoji_reactions?.split(",").map((emoji, j) => (
                      <span key={j} className="text-lg">
                        {emojiMap[emoji] || emoji}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {testimonials.length === 0 && (
          <div className="text-center py-12 mb-8">
            <p className="text-muted-foreground">No testimonials yet. Be the first to share the love!</p>
          </div>
        )}

        {/* Floating Button with Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                initial={{ scale: 0 }}
                animate={{
                  scale: isFormOpen ? 1 : [1, 1.05, 1],
                }}
                transition={{
                  scale: {
                    duration: 2,
                    repeat: isFormOpen ? 0 : Infinity,
                    repeatType: "loop"
                  }
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="fixed bottom-24 right-6 bg-gradient-to-r from-rose-500 to-amber-500 text-white p-4 rounded-full shadow-2xl hover:shadow-rose-500/50 transition-shadow z-40"
              >
                {isFormOpen ? (
                  <ChevronDown className="w-6 h-6" />
                ) : (
                  <div className="relative">
                    <Star className="w-6 h-6 fill-white" />
                    <span className="absolute -bottom-1 -right-1 text-lg">
                      ✨
                    </span>
                  </div>
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-gradient-to-r from-rose-500 to-amber-500 text-white border-0">
              <p className="font-medium">Share your experience 💕</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Semi-transparent Backdrop */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-black/20 z-20"
            />
          )}
        </AnimatePresence>

        {/* Bottom Sheet Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 500) {
                  setIsFormOpen(false)
                }
              }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-30 max-h-[75vh] overflow-y-auto bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/95 dark:to-amber-950/95 rounded-t-3xl shadow-2xl"
            >
              <div className="p-6">
                {/* Drag Handle */}
                <div className="flex justify-center mb-4 cursor-grab active:cursor-grabbing">
                  <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {!session?.user ? (
                  // Login Prompt
                  <div className="text-center py-8">
                    <LogIn className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-bold text-lg mb-2">Login Required</h3>
                    <p className="text-muted-foreground mb-6">
                      Only verified customers can leave testimonials
                    </p>
                    <div className="flex flex-col gap-3">
                      <Link href="/login" className="w-full">
                        <button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl shadow-lg transition-all">
                          Login to Your Account
                        </button>
                      </Link>
                      <Link href="/register" className="w-full">
                        <button className="w-full bg-white border-2 border-rose-200 hover:border-rose-300 text-foreground font-medium py-3 rounded-xl transition-all">
                          Create an Account
                        </button>
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      💡 You must have made a purchase to leave a testimonial
                    </p>
                  </div>
                ) : (
                  // Testimonial Form
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">💬</span>
                      <h3 className="font-bold text-lg">Send Your Love</h3>
                    </div>

                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-3 mb-4">
                      <p className="text-sm text-rose-900 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Posting as <strong>{session.user.name || session.user.email}</strong>
                      </p>
                      <p className="text-xs text-rose-700 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified Customer - Your testimonial will appear immediately
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Message Textarea */}
                      <div className="relative">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Share your experience... (you can use emojis! 💕✨)"
                          required
                          maxLength={280}
                          rows={4}
                          disabled={loading}
                          className="w-full px-3 py-3 bg-white dark:bg-gray-900 border border-rose-200 dark:border-rose-800 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/280</p>
                      </div>

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Post Testimonial 💕
                          </>
                        )}
                      </button>

                      <p className="text-xs text-center text-green-600 font-medium">
                        ✓ Your testimonial will appear immediately!
                      </p>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default TestimonialsPage
