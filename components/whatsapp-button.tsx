"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { WHATSAPP_NUMBER } from "@/lib/whatsapp"

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Hide on testimonials page to avoid overlap with testimonial form button
  if (pathname === "/testimonials") {
    return null
  }

  const handleClick = () => {
    const message = encodeURIComponent("Hi! I'm interested in your products.")
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank")
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className="fixed bottom-24 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-colors"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-green-600 text-white border-0">
          <p className="font-medium">Chat with us on WhatsApp</p>
        </TooltipContent>
      </Tooltip>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl p-4 max-w-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">Chat with us!</p>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Have questions? We're here to help!
            </p>
            <button
              onClick={handleClick}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Start Chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  )
}
